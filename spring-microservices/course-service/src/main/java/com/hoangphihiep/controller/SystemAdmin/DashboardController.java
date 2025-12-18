package com.hoangphihiep.controller.SystemAdmin;

import com.hoangphihiep.dto.request.DashboardFilterRequest;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.DashboardResponse;
import com.hoangphihiep.factory.DashboardFilterFactory;
import com.hoangphihiep.service.DashboardService;
import com.hoangphihiep.utils.EducationType;
import com.hoangphihiep.utils.PeriodType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/super-admin/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "System Admin Dashboard", description = "Dashboard analytics and KPI endpoints for system administrators")
public class DashboardController {
    private final DashboardFilterFactory filterFactory;
    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public ApiResponse<?> getOverview(@RequestParam(required = false) PeriodType periodType,
                                      @RequestParam(required = false) EducationType educationType) {
        DashboardFilterRequest request = filterFactory.from(periodType, educationType);
        DashboardResponse response = dashboardService.getDashboardStatistics(request);
        return ApiResponse.success(response, "Dashboard overview retrieved successfully");
    }

    @GetMapping("/statistics")
    @Operation(
            summary = "Get comprehensive dashboard statistics",
            description = "Retrieve comprehensive dashboard KPIs including user stats, organization stats, " +
                    "course activity, completion rates, traffic metrics, and pending violations. " +
                    "All metrics include comparison with previous equivalent period."
    )
    public ApiResponse<DashboardResponse> getDashboardStatistics(
            @Parameter(description = "Time period filter (WEEK, MONTH, YEAR, CUSTOM)")
            @RequestParam(required = false, defaultValue = "MONTH") PeriodType period,

            @Parameter(description = "Education type filter (UNIVERSITY, COLLEGE, INTERMEDIATE, ALL)")
            @RequestParam(required = false, defaultValue = "ALL") EducationType educationType,

            @Parameter(description = "Custom period start date (required if period=CUSTOM)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,

            @Parameter(description = "Custom period end date (required if period=CUSTOM)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        log.info("Dashboard statistics request - Period: {}, EducationType: {}", period, educationType);

        DashboardFilterRequest filter = DashboardFilterRequest.builder()
                .period(period)
                .educationType(educationType)
                .from(from)
                .to(to)
                .build();

        DashboardResponse response = dashboardService.getDashboardStatistics(filter);

        return ApiResponse.success(
                response,
                "Dashboard statistics retrieved successfully"
        );
    }

    @PostMapping("/statistics")
    @Operation(
            summary = "Get dashboard statistics (POST)",
            description = "Alternative POST endpoint for retrieving dashboard statistics with filter in request body"
    )
    public ApiResponse<DashboardResponse> getDashboardStatisticsPost(
            @Valid @RequestBody DashboardFilterRequest filter
    ) {
        log.info("Dashboard statistics POST request - Period: {}, EducationType: {}",
                filter.getPeriod(), filter.getEducationType());

        DashboardResponse response = dashboardService.getDashboardStatistics(filter);

        return ApiResponse.success(
                response,
                "Dashboard statistics retrieved successfully"
        );
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if dashboard service is operational")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.success(
                "Dashboard service is operational",
                "Health check successful"
        );
    }
}
