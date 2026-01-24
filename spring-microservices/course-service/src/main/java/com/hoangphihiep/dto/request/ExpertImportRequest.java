package com.hoangphihiep.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ExpertImportRequest {
    private List<ExpertRequest> experts;
}
