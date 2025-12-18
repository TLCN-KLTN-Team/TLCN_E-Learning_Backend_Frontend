package com.hoangphihiep.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardResponse {
    // User statistics with breakdown
    UserStatisticsResponse userStatistics;
    
    // Organization statistics
    OrganizationStatisticsResponse organizationStatistics;
    
    // Course activity (open/active courses)
    DashboardKPIResponse activeCourses;
    
    // Average completion rate (with growth)
    DashboardKPIResponse completionRate; // Stored as percentage * 10 (e.g., 725 for 72.5%)
    
    // Traffic metrics (weekly page views/access)
    DashboardKPIResponse weeklyTraffic;
    
    // Pending violations
    DashboardKPIResponse pendingViolations;
    
    // Period information
    String period;
    String educationType;
    String fromDate;
    String toDate;
}
