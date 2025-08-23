package com.devteria.identity.dto.request;

import java.util.Set;

public record UpdateRoleRequest(
        Set<String> roles
) {
}
