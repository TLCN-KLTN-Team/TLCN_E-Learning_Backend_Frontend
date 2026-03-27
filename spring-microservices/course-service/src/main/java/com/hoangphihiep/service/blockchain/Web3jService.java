package com.hoangphihiep.service.blockchain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class Web3jService {

    private final Web3j web3j;

    @Value("${blockchain.private-key:}")
    private String privateKey;

    @Value("${blockchain.contract-address:}")
    private String contractAddress;

    @Value("${blockchain.chain-id:1337}") 
    private long chainId;

    /**
     * Issues a certificate on blockchain by calling the 'issueCertificate' smart contract function.
     *
     * @param certificateCode Unique UUID code
     * @param userId The User ID
     * @param publishedCourseId The Course ID
     * @param certificateHash The SHA-256 hash
     * @return Transaction Hash
     */
    public String issueCertificateTransaction(String certificateCode, String userId, Integer publishedCourseId, String certificateHash) throws Exception {
        if (web3j == null) {
            throw new RuntimeException("Web3j is not connected. Check blockchain node.");
        }

        Credentials credentials = Credentials.create(privateKey);
        String fromAddress = credentials.getAddress();
        String toAddress = contractAddress;

        if (toAddress == null || toAddress.isEmpty()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        // Define the function we want to invoke from the smart contract
        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                "issueCertificate",
                java.util.Arrays.asList(
                        new org.web3j.abi.datatypes.Utf8String(certificateCode),
                        new org.web3j.abi.datatypes.Utf8String(userId),
                        new org.web3j.abi.datatypes.generated.Uint256(publishedCourseId),
                        new org.web3j.abi.datatypes.Utf8String(certificateHash)
                ),
                java.util.Collections.emptyList() // No return values
        );

        // Encode the function
        String encodedFunction = org.web3j.abi.FunctionEncoder.encode(function);

        // Pre-flight check to catch contract revert reason before sending tx
        EthCall preflight = web3j.ethCall(
            Transaction.createEthCallTransaction(fromAddress, toAddress, encodedFunction),
            DefaultBlockParameterName.LATEST
        ).send();

        if (preflight != null && preflight.isReverted()) {
            String reason = preflight.getRevertReason();
            throw new RuntimeException("Blockchain preflight reverted: " + (reason != null ? reason : "unknown reason"));
        }

        // Get Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                fromAddress, DefaultBlockParameterName.LATEST).sendAsync().get();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();

        // Gas limit (estimate or standard high value for contract call)
        BigInteger gasPrice = BigInteger.valueOf(20_000_000_000L); 
        BigInteger gasLimit = BigInteger.valueOf(500_000); // Higher limit for contract execution

        // Create transaction
        RawTransaction rawTransaction = RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, toAddress, BigInteger.ZERO, encodedFunction);

        // Sign transaction
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);

        // Send transaction
        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).sendAsync().get();

        if (ethSendTransaction.hasError()) {
            throw new RuntimeException("Blockchain Error: " + ethSendTransaction.getError().getMessage());
        }

        String transactionHash = ethSendTransaction.getTransactionHash();
        log.info("Smart Contract Transaction Sent! Hash: {}", transactionHash);

        // Wait for receipt and ensure tx is successful (status = 1)
        Optional<TransactionReceipt> receiptOptional = waitForReceipt(transactionHash, 30, 1000L);
        if (receiptOptional.isEmpty()) {
            throw new RuntimeException("Blockchain transaction not mined in time. txHash=" + transactionHash);
        }

        TransactionReceipt receipt = receiptOptional.get();
        if (!receipt.isStatusOK()) {
            throw new RuntimeException("Blockchain transaction reverted. txHash=" + transactionHash);
        }

        return transactionHash;
    }

    /**
     * Revokes/resets a certificate claim on-chain to allow re-issuance
     */
    public String revokeCertificateClaim(String userId, Integer publishedCourseId) throws Exception {
        if (web3j == null) {
            throw new RuntimeException("Web3j is not connected. Check blockchain node.");
        }

        Credentials credentials = Credentials.create(privateKey);
        String fromAddress = credentials.getAddress();
        String toAddress = contractAddress;

        if (toAddress == null || toAddress.isEmpty()) {
            throw new RuntimeException("Smart Contract Address is not configured!");
        }

        org.web3j.abi.datatypes.Function function = new org.web3j.abi.datatypes.Function(
                "revokeCertificateClaim",
                Arrays.asList(
                        new org.web3j.abi.datatypes.Utf8String(userId),
                        new org.web3j.abi.datatypes.generated.Uint256(publishedCourseId)
                ),
                java.util.Collections.emptyList()
        );

        String encodedFunction = org.web3j.abi.FunctionEncoder.encode(function);

        // Get Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                fromAddress, DefaultBlockParameterName.LATEST).sendAsync().get();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();

        BigInteger gasPrice = BigInteger.valueOf(20_000_000_000L);
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
        log.info("Certificate Claim Revoke Transaction Sent! Hash: {}", transactionHash);

        Optional<TransactionReceipt> receiptOptional = waitForReceipt(transactionHash, 30, 1000L);
        if (receiptOptional.isEmpty()) {
            throw new RuntimeException("Blockchain revoke transaction not mined in time. txHash=" + transactionHash);
        }

        TransactionReceipt receipt = receiptOptional.get();
        if (!receipt.isStatusOK()) {
            throw new RuntimeException("Blockchain revoke transaction reverted. txHash=" + transactionHash);
        }

        return transactionHash;
    }

    public String getContractAddress() {
        return contractAddress;
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
                        new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.Bool>() {},
                        new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.Utf8String>() {},
                        new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.generated.Uint256>() {},
                        new org.web3j.abi.TypeReference<org.web3j.abi.datatypes.generated.Uint256>() {}
                )
        );

        String encodedFunction = org.web3j.abi.FunctionEncoder.encode(function);

        EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
        ).send();

        if (response == null || response.getValue() == null || response.getValue().equals("0x")) {
            throw new RuntimeException("Empty blockchain response for certificate verification");
        }

        List<org.web3j.abi.datatypes.Type> decoded = org.web3j.abi.FunctionReturnDecoder.decode(
                response.getValue(),
                function.getOutputParameters()
        );

        if (decoded.size() < 4) {
            throw new RuntimeException("Invalid blockchain response format for certificate verification");
        }

        boolean valid = ((org.web3j.abi.datatypes.Bool) decoded.get(0)).getValue();
        String userId = ((org.web3j.abi.datatypes.Utf8String) decoded.get(1)).getValue();
        Integer publishedCourseId = ((org.web3j.abi.datatypes.generated.Uint256) decoded.get(2)).getValue().intValue();
        long issueTimestampSeconds = ((org.web3j.abi.datatypes.generated.Uint256) decoded.get(3)).getValue().longValue();

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
