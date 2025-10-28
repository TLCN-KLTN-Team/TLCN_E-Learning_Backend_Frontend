package com.hoangphihiep.mapper;

import com.hoangphihiep.dto.response.AssignmentResponse;
import com.hoangphihiep.entity.Assignment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {

    @Mapping(source = "section.id", target = "sectionId")
    @Mapping(source = "section.title", target = "sectionName")
    @Mapping(target = "submissionsCount", expression = "java(assignment.getSubmissions() != null ? assignment.getSubmissions().size() : 0)")
    AssignmentResponse toAssignmentResponse(Assignment assignment);
}