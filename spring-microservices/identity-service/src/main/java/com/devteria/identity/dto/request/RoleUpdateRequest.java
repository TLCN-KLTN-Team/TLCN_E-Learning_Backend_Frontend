package com.devteria.identity.dto.request;

import java.util.Set;

public record RoleUpdateRequest(
        Set<String> roles
) {

}
