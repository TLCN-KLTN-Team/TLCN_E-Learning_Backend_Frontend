package com.hoangphihiep.service.blockchain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.generated.Bytes32;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthEstimateGas;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthGetTransactionReceipt;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.utils.Numeric;
import org.web3j.abi.datatypes.*;
import java.math.BigInteger;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class Web3jService {

    private static final int MAX_RECEIPT_ATTEMPTS = 120;
    private static final long RECEIPT_POLLING_INTERVAL_MS = 1000L;

    private final Web3j web3j;

    @Value("${blockchain.private-key:}")
    private String privateKey;

    @Value("${blockchain.contract-address:}")
    private String contractAddress;

    @Value("${blockchain.chain-id:1337}") 
    private long chainId;

    public String issueCertificateTransaction(String studentWallet, String certificateCode, String userId, Integer publishedCourseId, String certificateHash, String tokenUri, String tokenId) throws Exception {
        Credentials credentials = Credentials.create(privateKey);
        String fromAddress = credentials.getAddress();
        String toAddress = contractAddress;

        if (toAddress == null || toAddress.isEmpty()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        log.info("=== BLOCKCHAIN CERTIFICATE ISSUANCE DEBUG ===");
        log.info("Issuer Wallet: {}", fromAddress);
        log.info("Contract Address: {}", toAddress);
        log.info("Student Wallet: {}", studentWallet);
        log.info("Certificate Code: {}", certificateCode);
        log.info("User ID: {}", userId);
        log.info("Published Course ID: {}", publishedCourseId);
        log.info("Certificate Hash: {}", certificateHash);
        log.info("Token URI: {}", tokenUri);
        log.info("Token ID: {}", tokenId);

        // Define the function we want to invoke from the smart contract
        // The upgraded contract mints the NFT with the backend-provided tokenId and tokenUri
        List<Type> functionParams = new ArrayList<>(Arrays.asList(
            new Address(studentWallet),
                new Utf8String(certificateCode),
                new Utf8String(userId),
                new Uint256(publishedCourseId),
            new Utf8String(certificateHash),
            new Utf8String(tokenUri != null ? tokenUri : ""),
            new Uint256(new BigInteger(tokenId)),
            new Uint256(BigInteger.ZERO) // expiryDate (0 = no expiration)
        ));

        Function function = new Function(
                "issueCertificate",
                functionParams,
                Collections.emptyList() // No return values
        );

        // Encode the function
        String encodedFunction = FunctionEncoder.encode(function);
        log.info("Encoded Function Data: {}", encodedFunction);

        // Pre-flight check to catch contract revert reason before sending tx
        log.info("Executing preflight check...");
        EthCall preflight = web3j.ethCall(
            Transaction.createEthCallTransaction(fromAddress, toAddress, encodedFunction),
            DefaultBlockParameterName.LATEST
        ).send();

        log.info("Preflight Response - isReverted: {}, hasError: {}", 
            preflight != null ? preflight.isReverted() : "null", 
            preflight != null ? preflight.hasError() : "null");
        
        if (preflight != null && preflight.hasError()) {
            log.error("Preflight Error: {}", preflight.getError().getMessage());
            throw new RuntimeException("Blockchain preflight error: " + preflight.getError().getMessage());
        }

        if (preflight != null && preflight.isReverted()) {
            String reason = preflight.getRevertReason();
            log.error("Preflight Reverted - Reason: {}", reason);
            throw new RuntimeException("Blockchain preflight reverted: " + (reason != null ? reason : "unknown reason"));
        }

        // Additional on-chain precondition checks to avoid race conditions between preflight and actual tx
        // 1) certificateCodeToTokenId must be 0
        log.info("Checking certificateCodeToTokenId for code: {}", certificateCode);
        BigInteger existingTokenForCode = callUint256View("certificateCodeToTokenId", new Utf8String(certificateCode));
        log.info("Existing token for code: {}", existingTokenForCode);
        if (existingTokenForCode != null && existingTokenForCode.compareTo(BigInteger.ZERO) > 0) {
            throw new RuntimeException("Certificate code already exists on-chain: " + certificateCode);
        }

        // 2) certificateHashToTokenId must be 0
        log.info("Checking certificateHashToTokenId for hash: {}", certificateHash);
        BigInteger existingTokenForHash = callUint256View("certificateHashToTokenId", new Utf8String(certificateHash));
        log.info("Existing token for hash: {}", existingTokenForHash);
        if (existingTokenForHash != null && existingTokenForHash.compareTo(BigInteger.ZERO) > 0) {
            throw new RuntimeException("Certificate hash already exists on-chain: " + certificateHash);
        }

        // 3) userCourseClaims[keccak(userId, publishedCourseId)] must be false
        log.info("Checking userCourseClaims for userId: {}, publishedCourseId: {}", userId, publishedCourseId);
        boolean claimExists = callUserCourseClaim(userId, publishedCourseId);
        log.info("Claim already exists: {}", claimExists);
        if (claimExists) {
            throw new RuntimeException("Certificate already issued for this user and course on-chain");
        }

        // Get Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
            fromAddress, DefaultBlockParameterName.PENDING).send();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();
        log.info("Nonce: {}", nonce);

        // Gas price: prefer current network gas price and apply a buffer; fallback to default
        BigInteger gasPrice;
        try {
            gasPrice = web3j.ethGasPrice().send().getGasPrice().multiply(BigInteger.valueOf(2));
        } catch (Exception e) {
            log.warn("Failed to read network gas price, using default. Error: {}", e.getMessage());
            gasPrice = BigInteger.valueOf(20_000_000_000L);
        }
        BigInteger gasLimit = estimateGasLimit(fromAddress, toAddress, encodedFunction);
        log.info("Gas Price: {}, Gas Limit: {}", gasPrice, gasLimit);

        // Preflight balance check: ensure fromAddress has enough ETH/MATIC for gas
        try {
            BigInteger balance = web3j.ethGetBalance(fromAddress, DefaultBlockParameterName.LATEST).send().getBalance();
            BigInteger required = gasPrice.multiply(gasLimit);
            log.info("Wallet Balance: {}, Required: {}", balance, required);
            if (balance.compareTo(required) < 0) {
                throw new RuntimeException("INSUFFICIENT_FUNDS: Wallet " + fromAddress + " balance=" + balance + " required=" + required);
            }
        } catch (RuntimeException re) {
            // rethrow runtime exceptions
            throw re;
        } catch (Exception e) {
            log.warn("Unable to verify wallet balance before sending tx", e);
        }

        // Create transaction
        RawTransaction rawTransaction = RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, toAddress, BigInteger.ZERO, encodedFunction);

        // Sign transaction
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);
        log.info("Signed TX: {}...", hexValue.substring(0, Math.min(50, hexValue.length())));

        // Send transaction
        log.info("Sending transaction to blockchain...");
        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).sendAsync().get();

        if (ethSendTransaction.hasError()) {
            log.error("Blockchain Send Error: {}", ethSendTransaction.getError().getMessage());
            throw new RuntimeException("Blockchain Error: " + ethSendTransaction.getError().getMessage());
        }

        String transactionHash = ethSendTransaction.getTransactionHash();
        log.info("Smart Contract Transaction Sent! Hash: {}", transactionHash);

        // Wait for receipt and ensure tx is successful (status = 1)
        log.info("Waiting for receipt (max {} attempts, {} ms interval)...", MAX_RECEIPT_ATTEMPTS, RECEIPT_POLLING_INTERVAL_MS);
        Optional<TransactionReceipt> receiptOptional = waitForReceipt(transactionHash, MAX_RECEIPT_ATTEMPTS, RECEIPT_POLLING_INTERVAL_MS);
        if (receiptOptional.isEmpty()) {
            log.error("Transaction not mined in time. txHash={}", transactionHash);
            throw new RuntimeException("Blockchain transaction not mined in time. txHash=" + transactionHash);
        }

        TransactionReceipt receipt = receiptOptional.get();
        log.info("Transaction Status: {}, GasUsed: {}, Logs: {}", 
            receipt.isStatusOK() ? "SUCCESS" : "FAILED", 
            receipt.getGasUsed(),
            receipt.getLogs() != null ? receipt.getLogs().size() : 0);
        
        if (!receipt.isStatusOK()) {
            log.error("Transaction reverted. Status: {}, Receipt: {}", receipt.getStatus(), receipt);
            throw new RuntimeException("Blockchain transaction reverted. txHash=" + transactionHash);
        }

        log.info("=== BLOCKCHAIN CERTIFICATE ISSUANCE SUCCESS ===");
        return transactionHash;
    }

    private BigInteger estimateGasLimit(String fromAddress, String toAddress, String encodedFunction) {
        try {
            EthEstimateGas estimateGas = web3j.ethEstimateGas(
                    Transaction.createFunctionCallTransaction(fromAddress, null, null, null, toAddress, encodedFunction)
            ).send();

            if (estimateGas != null && estimateGas.getAmountUsed() != null) {
                BigInteger estimated = estimateGas.getAmountUsed();
                BigInteger buffered = estimated.multiply(BigInteger.valueOf(130)).divide(BigInteger.valueOf(100));
                BigInteger minimum = BigInteger.valueOf(1_200_000L);
                BigInteger gasLimit = buffered.max(minimum);
                log.info("Estimated gas: {}, buffered gas limit: {}", estimated, gasLimit);
                return gasLimit;
            }

            log.warn("Gas estimation returned empty, falling back to 1_500_000");
        } catch (Exception e) {
            log.warn("Gas estimation failed, falling back to 1_500_000", e);
        }

        return BigInteger.valueOf(1_500_000L);
    }

    private BigInteger callUint256View(String functionName, Type param) throws Exception {
        log.debug("Calling view function: {} with param: {}", functionName, param);
        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                functionName,
                List.of(param),
                List.of(new TypeReference<Uint256>() {})
        );

        String encoded = FunctionEncoder.encode(function);
        log.debug("Encoded view call: {}", encoded);
        EthCall response = web3j.ethCall(Transaction.createEthCallTransaction(null, contractAddress, encoded), DefaultBlockParameterName.LATEST).send();
        log.debug("View call response: value={}, hasError={}", response.getValue(), response.hasError());
        
        if (response == null || response.getValue() == null || response.getValue().equals("0x")) {
            log.debug("View function returned empty, returning ZERO");
            return BigInteger.ZERO;
        }
        List<? extends Type> decoded = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        if (decoded.isEmpty()) {
            log.debug("Decoded result is empty, returning ZERO");
            return BigInteger.ZERO;
        }
        BigInteger result = ((Uint256) decoded.get(0)).getValue();
        log.debug("View function {} result: {}", functionName, result);
        return result;
    }

    private boolean callUserCourseClaim(String userId, Integer publishedCourseId) throws Exception {
        // Compute keccak256(abi.encodePacked(userId, publishedCourseId))
        byte[] userBytes = userId.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] idBytes = BigInteger.valueOf(publishedCourseId).toByteArray();
        log.debug("User ID bytes length: {}, value: {}", userBytes.length, new String(userBytes));
        log.debug("Published Course ID bytes length: {}, hex: {}", idBytes.length, org.web3j.utils.Numeric.toHexString(idBytes));
        
        // left-pad idBytes to 32 bytes
        byte[] idPadded = new byte[32];
        int copyStart = Math.max(0, 32 - idBytes.length);
        System.arraycopy(idBytes, 0, idPadded, copyStart, Math.min(idBytes.length, 32));
        log.debug("Padded course ID (32 bytes): {}", org.web3j.utils.Numeric.toHexString(idPadded));

        byte[] packed = new byte[userBytes.length + idPadded.length];
        System.arraycopy(userBytes, 0, packed, 0, userBytes.length);
        System.arraycopy(idPadded, 0, packed, userBytes.length, idPadded.length);
        log.debug("Packed bytes length: {}, hex: {}", packed.length, org.web3j.utils.Numeric.toHexString(packed));

        String hashHex = org.web3j.crypto.Hash.sha3(org.web3j.utils.Numeric.toHexStringNoPrefix(packed));
        log.debug("Keccak256 hash: {}", hashHex);
        
        // Hash.sha3 returns 0x-prefixed hex; convert to Bytes32
        byte[] hashBytes = org.web3j.utils.Numeric.hexStringToByteArray(hashHex);
        Bytes32 key = new Bytes32(Arrays.copyOf(hashBytes, 32));
        log.debug("Bytes32 key: {}", org.web3j.utils.Numeric.toHexString(key.getValue()));

        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                "userCourseClaims",
                List.of(key),
                List.of(new TypeReference<Bool>() {})
        );

        String encoded = FunctionEncoder.encode(function);
        log.debug("Encoded userCourseClaims call: {}", encoded);
        EthCall response = web3j.ethCall(Transaction.createEthCallTransaction(null, contractAddress, encoded), DefaultBlockParameterName.LATEST).send();
        log.debug("userCourseClaims response: value={}, hasError={}", response.getValue(), response.hasError());
        
        if (response == null || response.getValue() == null || response.getValue().equals("0x")) {
            log.debug("userCourseClaims returned empty, returning false");
            return false;
        }
        List<? extends Type> decoded = FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
        if (decoded.isEmpty()) {
            log.debug("userCourseClaims decoded is empty, returning false");
            return false;
        }
        boolean result = ((Bool) decoded.get(0)).getValue();
        log.debug("userCourseClaims result: {}", result);
        return result;
    }

    public String revokeCertificateClaim(String userId, Integer publishedCourseId) throws Exception {
        Credentials credentials = Credentials.create(privateKey);
        String fromAddress = credentials.getAddress();
        String toAddress = contractAddress;

        if (toAddress == null || toAddress.isEmpty()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        Function function = new Function(
            "resetRevokedCertificateClaim",
            Arrays.asList(
                new Utf8String(userId),
                new Uint256(publishedCourseId),
                new Utf8String("Recovered from stale on-chain claim")
            ),
            Collections.emptyList()
        );

        String encodedFunction = FunctionEncoder.encode(function);

        // Get Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
            fromAddress, DefaultBlockParameterName.PENDING).send();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();

        BigInteger gasPrice;
        try {
            gasPrice = web3j.ethGasPrice().send().getGasPrice().multiply(BigInteger.valueOf(2));
        } catch (Exception e) {
            log.warn("Failed to read network gas price for revoke, using default. Error: {}", e.getMessage());
            gasPrice = BigInteger.valueOf(20_000_000_000L);
        }
        BigInteger gasLimit = BigInteger.valueOf(300_000);

        RawTransaction rawTransaction = RawTransaction.createTransaction(
            nonce, gasPrice, gasLimit, toAddress, BigInteger.ZERO, encodedFunction);

        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);

        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).sendAsync().get();

        if (ethSendTransaction.hasError()) {
            throw new RuntimeException("Blockchain Error: " + ethSendTransaction.getError().getMessage());
        }

        String transactionHash = ethSendTransaction.getTransactionHash();
        log.info("Certificate Claim Reset Transaction Sent! Hash: {}", transactionHash);

        Optional<TransactionReceipt> receiptOptional = waitForReceipt(transactionHash, MAX_RECEIPT_ATTEMPTS, RECEIPT_POLLING_INTERVAL_MS);
        if (receiptOptional.isEmpty()) {
            throw new RuntimeException("Blockchain claim reset transaction not mined in time. txHash=" + transactionHash);
        }

        TransactionReceipt receipt = receiptOptional.get();
        if (!receipt.isStatusOK()) {
            throw new RuntimeException("Blockchain claim reset transaction reverted. txHash=" + transactionHash);
        }

        return transactionHash;
    }

    public OnChainCertificateData verifyCertificate(String certificateCode) throws Exception {
        if (web3j == null) {
            throw new RuntimeException("Web3j is not connected. Check blockchain node.");
        }
        if (contractAddress == null || contractAddress.isBlank()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                "verifyCertificate",
                List.of(new org.web3j.abi.datatypes.Utf8String(certificateCode)),
                Arrays.asList(
                        new TypeReference<Bool>() {},
                        new TypeReference<Utf8String>() {},
                        new TypeReference<Uint256>() {},
                        new TypeReference<Uint256>() {}
                )
        );

        String encodedFunction = FunctionEncoder.encode(function);

        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();

        if (response == null || response.getValue() == null || response.getValue().equals("0x")) {
            log.warn("Empty blockchain response for certificate verification (code={})", certificateCode);
            return OnChainCertificateData.builder().valid(false).userId(null).publishedCourseId(null).issueDate(null).build();
        }

        List<Type> decoded = FunctionReturnDecoder.decode(
                response.getValue(),
                function.getOutputParameters()
        );

        if (decoded.size() < 4) {
            log.warn("Invalid blockchain response format for certificate verification (code={}), decodedSize={}", certificateCode, decoded.size());
            return OnChainCertificateData.builder().valid(false).userId(null).publishedCourseId(null).issueDate(null).build();
        }

        boolean valid = ((Bool) decoded.get(0)).getValue();
        String userId = ((Utf8String) decoded.get(1)).getValue();
        Integer publishedCourseId = ((Uint256) decoded.get(2)).getValue().intValue();
        long issueTimestampSeconds = ((Uint256) decoded.get(3)).getValue().longValue();

        Date issueDate = issueTimestampSeconds > 0
                ? new Date(issueTimestampSeconds * 1000L)
                : null;

        return OnChainCertificateData.builder()
                .valid(valid)
                .userId(userId)
                .publishedCourseId(publishedCourseId)
                .issueDate(issueDate)
                .build();
    }

    public OnChainCertificateData verifyCertificateByHash(String certificateHash) throws Exception {
        if (web3j == null) {
            throw new RuntimeException("Web3j is not connected. Check blockchain node.");
        }
        if (contractAddress == null || contractAddress.isBlank()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        // Call blockchain function to verify by hash
        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                "verifyCertificateByHash",
                List.of(new org.web3j.abi.datatypes.Utf8String(certificateHash)),
                Arrays.asList(
                        new TypeReference<Bool>() {},
                        new TypeReference<Utf8String>() {},
                        new TypeReference<Uint256>() {},
                        new TypeReference<Uint256>() {}
                )
        );

        String encodedFunction = FunctionEncoder.encode(function);

        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();

        if (response == null || response.getValue() == null || response.getValue().equals("0x")) {
            log.warn("Empty blockchain response for certificate hash verification (hash={})", certificateHash);
            return OnChainCertificateData.builder().valid(false).userId(null).publishedCourseId(null).issueDate(null).build();
        }

        List<? extends Type> decoded = FunctionReturnDecoder.decode(
                response.getValue(),
                function.getOutputParameters()
        );

        if (decoded.size() < 4) {
            log.warn("Invalid blockchain response format for certificate hash verification (hash={}), decodedSize={}", certificateHash, decoded.size());
            return OnChainCertificateData.builder().valid(false).userId(null).publishedCourseId(null).issueDate(null).build();
        }

        boolean valid = ((Bool) decoded.get(0)).getValue();
        String userId = ((Utf8String) decoded.get(1)).getValue();
        Integer publishedCourseId = ((Uint256) decoded.get(2)).getValue().intValue();
        long issueTimestampSeconds = ((Uint256) decoded.get(3)).getValue().longValue();

        Date issueDate = issueTimestampSeconds > 0
                ? new Date(issueTimestampSeconds * 1000L)
                : null;

        return OnChainCertificateData.builder()
                .valid(valid)
                .userId(userId)
                .publishedCourseId(publishedCourseId)
                .issueDate(issueDate)
                .build();
    }


    public BigInteger getBlockNumber(String transactionHash) {
        try {
            // Wait a bit or check immediately (assuming caller handles wait)
            return web3j.ethGetTransactionReceipt(transactionHash).send()
                    .getTransactionReceipt()
                    .map(TransactionReceipt::getBlockNumber)
                    .orElse(BigInteger.ZERO);
        } catch (Exception e) {
            log.error("Error getting block number: {}", e.getMessage());
            return BigInteger.ZERO;
        }
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public Boolean isTransactionSuccessful(String transactionHash) {
        if (transactionHash == null || transactionHash.isBlank()) {
            return null;
        }

        try {
            Optional<TransactionReceipt> receipt = web3j.ethGetTransactionReceipt(transactionHash)
                    .send()
                    .getTransactionReceipt();

            if (receipt.isEmpty()) {
                return null;
            }

            return receipt.get().isStatusOK();
        } catch (Exception exception) {
            log.warn("Cannot determine transaction status for {}", transactionHash, exception);
            return null;
        }
    }

    private Optional<TransactionReceipt> waitForReceipt(String transactionHash, int maxAttempts, long sleepMillis)
            throws Exception {
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            Optional<TransactionReceipt> receipt = web3j.ethGetTransactionReceipt(transactionHash)
                    .send()
                    .getTransactionReceipt();
            if (receipt.isPresent()) {
                return receipt;
            }
            Thread.sleep(sleepMillis);
        }
        return Optional.empty();
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class OnChainCertificateData {
        private boolean valid;
        private String userId;
        private Integer publishedCourseId;
        private Date issueDate;
    }
}
