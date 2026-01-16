package com.hoangphihiep.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class TeacherImportRequest {
    private List<TeacherRequest> teachers;
}
