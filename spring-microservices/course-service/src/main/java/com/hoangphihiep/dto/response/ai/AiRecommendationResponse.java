package com.hoangphihiep.dto.response.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiRecommendationResponse {
    @JsonProperty("recommendations")
    private List<AiRecommendationItem> recommendations;
}
