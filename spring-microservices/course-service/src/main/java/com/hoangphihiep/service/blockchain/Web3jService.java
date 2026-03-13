package com.hoangphihiep.service.blockchain;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.RawTransaction;
import org.web3j.crypto.TransactionEncoder;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetTransactionCount;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.utils.Numeric;

import java.math.BigInteger;

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

        return transactionHash;
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
}
