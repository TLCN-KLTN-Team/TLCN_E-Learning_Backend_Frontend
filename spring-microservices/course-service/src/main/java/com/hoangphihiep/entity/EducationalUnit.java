package com.hoangphihiep.entity;


import jakarta.persistence.*;
import lombok.*;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "educational_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EducationalUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;
    private String type;
    private String address;
    private String phone;
    private String email;
    private String website;
    private String logo;
    private String businessLicense;
    private String description;
    private Integer establishedYear;
    private String status;

    @Column(name = "admin_id")
    private String idAdmin;

    @ManyToOne
    @JoinColumn(name = "subscription_plan_id")
    private SubscriptionPlan subscriptionPlan;

    @Temporal(TemporalType.DATE)
    private Date subscriptionStartDate;

    @Temporal(TemporalType.DATE)
    private Date subscriptionEndDate;

    @Temporal(TemporalType.DATE)
    private Date createdAt;

    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Department> departments = new HashSet<>();

    @OneToMany(mappedBy = "institution", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Course> courses = new HashSet<>();
}
