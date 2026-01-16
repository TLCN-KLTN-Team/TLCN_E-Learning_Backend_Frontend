package com.hoangphihiep.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class StudentImportRequest {
    private List<StudentRequest> students;
}
