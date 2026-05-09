package com.hoangphihiep.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

@lombok.Data
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class PinataPinResponse {
    @JsonProperty("IpfsHash")
    @JsonAlias({"ipfsHash", "IpfsHash"})
    private String ipfsHash;
    @JsonProperty("PinSize")
    @JsonAlias({"pinSize", "PinSize"})
    private Integer pinSize;
    @JsonProperty("Timestamp")
    @JsonAlias({"timestamp", "Timestamp"})
    private String timestamp;
}