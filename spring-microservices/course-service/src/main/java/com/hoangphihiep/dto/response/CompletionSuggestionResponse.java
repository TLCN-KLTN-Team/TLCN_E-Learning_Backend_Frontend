package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompletionSuggestionResponse {
    String query;
    @Builder.Default
    List<String> titleSuggestions = new ArrayList<>();
    @Builder.Default
    List<String> categorySuggestions = new ArrayList<>();
    @Builder.Default
    List<String> phraseSuggestions = new ArrayList<>();
    @Builder.Default
    List<String> termsSuggestions = new ArrayList<>();
}
