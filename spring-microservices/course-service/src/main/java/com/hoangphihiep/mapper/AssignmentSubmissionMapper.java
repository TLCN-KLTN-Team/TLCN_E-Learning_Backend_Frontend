package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.AssignmentSubmissionResponse;
import com.hoangphihiep.entity.AssignmentSubmission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AssignmentSubmissionMapper {

    @Mapping(source = "assignment.id", target = "assignmentId")
    @Mapping(source = "assignment.title", target = "assignmentTitle")
    @Mapping(source = "idUser", target = "idUser")
    @Mapping(target = "userName", ignore = true) // Sẽ set thủ công trong service
    AssignmentSubmissionResponse toAssignmentSubmissionResponse(AssignmentSubmission submission);
}