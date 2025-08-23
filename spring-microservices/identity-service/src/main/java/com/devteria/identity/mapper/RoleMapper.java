package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.devteria.identity.dto.request.RoleRequest;
import com.devteria.identity.dto.response.RoleResponse;
import com.devteria.identity.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
