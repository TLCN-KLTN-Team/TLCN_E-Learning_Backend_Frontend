package com.hoangphihiep.dto.request.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiRecommendationRequest {
    @JsonProperty("user_profile")
    private UserProfile userProfile;

    @JsonProperty("candidates")
    private List<Candidate> candidates;

    @JsonProperty("top_k")
    private int topK;
}
