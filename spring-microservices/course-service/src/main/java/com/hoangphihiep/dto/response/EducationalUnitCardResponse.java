package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EducationalUnitCardResponse {
    Integer id;
    String name;
    String address;
    String type;
    String logo;
    Integer establishedYear;
    List<String> departments;
}
