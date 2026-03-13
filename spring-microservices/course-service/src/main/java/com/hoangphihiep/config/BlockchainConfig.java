package com.hoangphihiep.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
@Slf4j
public class BlockchainConfig {

    @Value("${blockchain.rpc-url:http://localhost:7545}")
    private String rpcUrl;

    @Bean
    public Web3j web3j() {
        try {
            log.info("Connecting to Blockchain Node at: {}", rpcUrl);
            return Web3j.build(new HttpService(rpcUrl));
        } catch (Exception e) {
            log.error("Failed to connect to Blockchain Node: {}", e.getMessage());
            return null; // Handle null gracefully in service
        }
    }
}
