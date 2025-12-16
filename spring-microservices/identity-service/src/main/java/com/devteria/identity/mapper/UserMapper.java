package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.RegisterRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "accountStatus", ignore = true)
    User toUser(RegisterRequest request);

    @Mapping(target = "accountStatus", ignore = true)
    UserResponse toUserResponse(User user);

    @Mapping(target = "accountStatus", ignore = true)
    User updateUser(@MappingTarget User user, UserUpdateRequest request);
}
