package com.hoangphihiep.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassImportResponse {
    private int successful;
    private int failed;
    private List<ImportResultDetail> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportResultDetail {
        private String classCode;
        private boolean success;
        private String message;
    }
}
