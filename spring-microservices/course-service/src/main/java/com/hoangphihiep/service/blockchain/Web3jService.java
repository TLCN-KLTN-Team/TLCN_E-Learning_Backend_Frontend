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

    @Value("${blockchain.private-key}")
    private String privateKey;

    @Value("${blockchain.contract-address:}")
    private String contractAddress;

    @Value("${blockchain.chain-id:1337}") 
    private long chainId;

    /**
     * Issues a certificate on blockchain by sending a transaction containing the certificate hash.
     * In a real production scenario, this would call a Smart Contract method.
     * Here, for flexibility without recompiling contracts, we send a transaction with Input Data being the Hash.
     * This acts as a "Proof of Existence".
     *
     * @param certificateHash The SHA-256 hash or data of the certificate
     * @return Transaction Hash
     */
    public String issueCertificateTransaction(String certificateHash) throws Exception {
        if (web3j == null) {
            throw new RuntimeException("Web3j is not connected. Check blockchain node.");
        }

        Credentials credentials = Credentials.create(privateKey);
        String fromAddress = credentials.getAddress();

        // If no contract address is provided, we send to SELF (Proof of Existence on Issuer Address transactions)
        // OR we can send to a dummy address.
        String toAddress = (contractAddress == null || contractAddress.isEmpty()) ? fromAddress : contractAddress;

        // Get Nonce
        EthGetTransactionCount ethGetTransactionCount = web3j.ethGetTransactionCount(
                fromAddress, DefaultBlockParameterName.LATEST).sendAsync().get();
        BigInteger nonce = ethGetTransactionCount.getTransactionCount();

        // Create transaction
        // Gas Price: Default or Generic
        BigInteger gasPrice = BigInteger.valueOf(20_000_000_000L); // 20 Gwei
        BigInteger gasLimit = BigInteger.valueOf(300_000); // Standard limit

        // Data: The certificate hash (as Hex)
        String data = Numeric.toHexString(certificateHash.getBytes());

        RawTransaction rawTransaction = RawTransaction.createTransaction(
                nonce, gasPrice, gasLimit, toAddress, BigInteger.ZERO, data);

        // Sign transaction
        byte[] signedMessage = TransactionEncoder.signMessage(rawTransaction, chainId, credentials);
        String hexValue = Numeric.toHexString(signedMessage);

        // Send transaction
        EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).sendAsync().get();

        if (ethSendTransaction.hasError()) {
            throw new RuntimeException("Blockchain Error: " + ethSendTransaction.getError().getMessage());
        }

        String transactionHash = ethSendTransaction.getTransactionHash();
        log.info("Certificate Transaction Sent! Hash: {}", transactionHash);

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
