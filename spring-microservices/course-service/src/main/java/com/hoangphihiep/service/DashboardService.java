package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.DashboardFilterRequest;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.UserRepository;
import com.hoangphihiep.utils.EducationalUnitStatus;
import com.hoangphihiep.utils.PeriodRange;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final EducationalUnitRepository educationalUnitRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final PageVisitRepository pageVisitRepository;
    private final ViolationRepository violationRepository;
    private final UserRepository userRepository;

    /**
     * Get comprehensive dashboard statistics based on filter
     */
    public DashboardResponse getDashboardStatistics(DashboardFilterRequest filter) {
        log.info("Fetching dashboard statistics for period: {}, educationType: {}", 
                filter.getPeriod(), filter.getEducationType());

        // Calculate period ranges
        PeriodRange currentPeriod = PeriodRange.getCurrentPeriod(filter);
        PeriodRange previousPeriod = PeriodRange.getPreviousPeriod(filter);
        
        String educationType = filter.getEducationType() != null ? filter.getEducationType().name() : "ALL";

        // Convert LocalDate to java.util.Date for JPA queries
        Date currentStart = Date.valueOf(currentPeriod.getStartDate());
        Date currentEnd = Date.valueOf(currentPeriod.getEndDate());
        Date previousStart = Date.valueOf(previousPeriod.getStartDate());
        Date previousEnd = Date.valueOf(previousPeriod.getEndDate());

        // Build response
        return DashboardResponse.builder()
                .userStatistics(getUserStatistics(educationType, currentStart, currentEnd, previousStart, previousEnd))
                .organizationStatistics(getOrganizationStatistics(educationType, currentStart, currentEnd, previousStart, previousEnd))
                .activeCourses(getActiveCoursesKPI(educationType, currentStart, currentEnd, previousStart, previousEnd))
                .completionRate(getCompletionRateKPI(educationType, currentStart, currentEnd, previousStart, previousEnd))
                .weeklyTraffic(getWeeklyTrafficKPI(currentPeriod, previousPeriod))
                .pendingViolations(getPendingViolationsKPI(educationType, currentPeriod, previousPeriod))
                .period(filter.getPeriod() != null ? filter.getPeriod().name() : "MONTH")
                .educationType(educationType)
                .fromDate(currentPeriod.getStartDate().toString())
                .toDate(currentPeriod.getEndDate().toString())
                .build();
    }

    private Long countUsersByRole(String role) {
        try {
            return Long.parseLong(String.valueOf(userRepository.countUsersByRole(role).getResult()));
        } catch (Exception e) {
            throw new AppException(ErrorCode.FEIGN_CLIENT_ERROR);
        }
    }

    /**
     * Calculate user statistics with student/teacher breakdown
     */
    private UserStatisticsResponse getUserStatistics(String educationType, 
                                                      Date currentStart, Date currentEnd,
                                                      Date previousStart, Date previousEnd) {
        // Count distinct students who enrolled in the current period
        Long currentStudents = this.countUsersByRole("STUDENT");
        Long previousStudents = enrollmentRepository.countDistinctStudentsInPeriod(
                educationType, previousStart, previousEnd);

        // For teachers, count distinct teachers from courses (simplified approach)
        // In a real system, you'd call identity-service via Feign client
        Long currentTeachers = this.countUsersByRole("TEACHER"); // Approximation
        Long previousTeachers = courseRepository.countActiveCoursesInPeriod(
                educationType, previousStart, previousEnd) / 10;

        Long totalUsers = this.countUsersByRole("USER") + this.countUsersByRole("STUDENT") + this.countUsersByRole("TEACHER");
        Long totalCurrent = currentStudents + currentTeachers;
        Long totalPrevious = previousStudents + previousTeachers;

        Double growthRate = calculateGrowthRate(totalCurrent, totalPrevious);

        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .studentCount(currentStudents)
                .teacherCount(currentTeachers)
                .growthRate(growthRate)
                .build();
    }

    /**
     * Calculate organization statistics with active/inactive breakdown
     */
    private OrganizationStatisticsResponse getOrganizationStatistics(String educationType,
                                                                      Date currentStart, Date currentEnd,
                                                                      Date previousStart, Date previousEnd) {
        // Total organizations
        Long currentTotal = educationalUnitRepository.countTotalOrganizations(educationType);
        Long previousTotal = educationalUnitRepository.countOrganizationsInPeriod(
                educationType, previousStart, previousEnd);

        // Active and inactive counts
        Long activeCount = educationalUnitRepository.countOrganizationsByStatus(
                educationType, EducationalUnitStatus.ACTIVE);
        Long inactiveCount = educationalUnitRepository.countOrganizationsByStatus(
                educationType, EducationalUnitStatus.SUSPENDED);

        Double growthRate = calculateGrowthRate(currentTotal, previousTotal);

        return OrganizationStatisticsResponse.builder()
                .totalOrganizations(currentTotal)
                .activeOrganizations(activeCount != null ? activeCount : 0L)
                .inactiveOrganizations(inactiveCount != null ? inactiveCount : 0L)
                .growthRate(growthRate)
                .build();
    }

    /**
     * Calculate active courses KPI (courses with published status)
     */
    private DashboardKPIResponse getActiveCoursesKPI(String educationType,
                                                      Date currentStart, Date currentEnd,
                                                      Date previousStart, Date previousEnd) {
        Long currentCount = courseRepository.countTotalActiveCourses(educationType);
        Long previousCount = courseRepository.countActiveCoursesInPeriod(
                educationType, previousStart, previousEnd);

        return DashboardKPIResponse.calculate(
                currentCount != null ? currentCount : 0L,
                previousCount != null ? previousCount : 0L
        );
    }

    /**
     * Calculate average completion rate KPI
     * Returns percentage * 10 (e.g., 725 for 72.5%)
     */
    private DashboardKPIResponse getCompletionRateKPI(String educationType,
                                                       Date currentStart, Date currentEnd,
                                                       Date previousStart, Date previousEnd) {
        Double currentAvg = courseProgressRepository.getAverageCompletionRateInPeriod(
                educationType, currentStart, currentEnd);
        Double previousAvg = courseProgressRepository.getAverageCompletionRateInPeriod(
                educationType, previousStart, previousEnd);

        // Convert to percentage * 10 format
        Long currentRate = currentAvg != null ? Math.round(currentAvg * 10) : 0L;
        Long previousRate = previousAvg != null ? Math.round(previousAvg * 10) : 0L;

        return DashboardKPIResponse.calculate(currentRate, previousRate);
    }

    /**
     * Calculate weekly traffic KPI (page visits)
     */
    private DashboardKPIResponse getWeeklyTrafficKPI(PeriodRange currentPeriod, PeriodRange previousPeriod) {
        LocalDateTime currentStart = currentPeriod.getStartDate().atStartOfDay();
        LocalDateTime currentEnd = currentPeriod.getEndDate().atTime(LocalTime.MAX);
        LocalDateTime previousStart = previousPeriod.getStartDate().atStartOfDay();
        LocalDateTime previousEnd = previousPeriod.getEndDate().atTime(LocalTime.MAX);

        Long currentTraffic = pageVisitRepository.countVisitsInPeriod(currentStart, currentEnd);
        Long previousTraffic = pageVisitRepository.countVisitsInPeriod(previousStart, previousEnd);

        return DashboardKPIResponse.calculate(
                currentTraffic != null ? currentTraffic : 0L,
                previousTraffic != null ? previousTraffic : 0L
        );
    }

    /**
     * Calculate pending violations KPI
     */
    private DashboardKPIResponse getPendingViolationsKPI(String educationType,
                                                          PeriodRange currentPeriod, 
                                                          PeriodRange previousPeriod) {
        // Current pending violations (all time, filtered by education type)
        Long currentCount = violationRepository.countPendingViolations(educationType);
        
        // Previous period pending violations
        LocalDateTime previousStart = previousPeriod.getStartDate().atStartOfDay();
        LocalDateTime previousEnd = previousPeriod.getEndDate().atTime(LocalTime.MAX);
        Long previousCount = violationRepository.countPendingViolationsInPeriod(
                educationType, previousStart, previousEnd);

        return DashboardKPIResponse.calculate(
                currentCount != null ? currentCount : 0L,
                previousCount != null ? previousCount : 0L
        );
    }

    /**
     * Calculate growth rate percentage
     */
    private Double calculateGrowthRate(Long current, Long previous) {
        if (previous == null || previous == 0) {
            return current != null && current > 0 ? 100.0 : 0.0;
        }
        if (current == null) {
            return -100.0;
        }
        double rate = ((current - previous) * 100.0) / previous;
        return Math.round(rate * 10.0) / 10.0; // Round to 1 decimal place
    }

    public UserDistributionResponse getUserDistribution() {
        try {
            Long totalUsers = this.countUsersByRole("USER");
            Long adminUsers = this.countUsersByRole("ADMIN");
            Long instructorUsers = this.countUsersByRole("TEACHER");
            Long studentUsers = this.countUsersByRole("STUDENT");

            return UserDistributionResponse.builder()
                    .totalUsers(totalUsers)
                    .adminUsers(adminUsers)
                    .instructorUsers(instructorUsers)
                    .studentUsers(studentUsers)
                    .build();
        } catch (Exception e) {
            throw new AppException(ErrorCode.FEIGN_CLIENT_ERROR);
        }
    }
}

