package com.hoangphihiep.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class ClassImportRequest {
    private List<CourseClassRequest> classes;
}
