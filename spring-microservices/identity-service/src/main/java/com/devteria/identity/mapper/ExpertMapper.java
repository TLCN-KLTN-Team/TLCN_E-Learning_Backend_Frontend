package com.devteria.identity.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.ExpertRequest;
import com.devteria.identity.dto.response.ExpertResponse;
import com.devteria.identity.entity.Expert;

@Mapper(componentModel = "spring")
public interface ExpertMapper {

    @Mapping(source = "idEducational", target = "educationalUnitId")
    @Mapping(source = "avatarUrl", target = "avatarUrl")
    @Mapping(source = "phoneNumber", target = "phoneNumber")
    @Mapping(source = "bio", target = "bio")
    ExpertResponse toExpertResponse(Expert expert);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(source = "educationalUnitId", target = "idEducational")
    void updateExpert(@MappingTarget Expert expert, ExpertRequest request);

    List<ExpertResponse> toExpertResponseList(List<Expert> experts);
}
