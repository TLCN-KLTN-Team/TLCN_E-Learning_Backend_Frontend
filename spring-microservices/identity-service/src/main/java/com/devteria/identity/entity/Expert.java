package com.devteria.identity.entity;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "experts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Expert extends User {

    private String expertId;

    @Column(name = "educational_unit_id")
    private int idEducational;

    private String description;
}
