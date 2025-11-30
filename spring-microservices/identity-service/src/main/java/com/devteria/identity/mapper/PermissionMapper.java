package com.devteria.identity.mapper;

import com.devteria.identity.entity.Permission;
import org.mapstruct.Mapper;

import com.devteria.identity.dto.request.PermissionRequest;
import com.devteria.identity.dto.response.PermissionResponse;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    PermissionResponse toPermissionResponse(Permission permission);
}
