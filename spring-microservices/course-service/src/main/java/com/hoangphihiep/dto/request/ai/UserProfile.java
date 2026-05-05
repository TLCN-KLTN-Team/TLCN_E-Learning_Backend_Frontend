package com.hoangphihiep.dto.request.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserProfile {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("interests")
    private List<String> interests;

    @JsonProperty("history")
    private List<String> history;

    @JsonProperty("behavior_signals")
    private List<String> behaviorSignals;

    @JsonProperty("collaborative_signals")
    private List<String> collaborativeSignals;
}
