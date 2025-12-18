package com.hoangphihiep.utils;

import com.hoangphihiep.dto.request.DashboardFilterRequest;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Data
@AllArgsConstructor
public class PeriodRange {
    private LocalDate startDate;
    private LocalDate endDate;
    
    /**
     * Calculate the current period range based on filter
     */
    public static PeriodRange getCurrentPeriod(DashboardFilterRequest filter) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        if (filter.getPeriod() == PeriodType.CUSTOM) {
            // For CUSTOM, use provided dates
            startDate = filter.getFrom() != null ? filter.getFrom() : endDate.minusDays(30);
            endDate = filter.getTo() != null ? filter.getTo() : LocalDate.now();
        } else {
            // Calculate based on period type
            int days = filter.getPeriod().getDays();
            startDate = endDate.minusDays(days - 1); // -1 to include today
        }
        
        return new PeriodRange(startDate, endDate);
    }
    
    /**
     * Calculate the previous equivalent period for comparison
     */
    public static PeriodRange getPreviousPeriod(DashboardFilterRequest filter) {
        PeriodRange current = getCurrentPeriod(filter);
        long daysBetween = ChronoUnit.DAYS.between(current.getStartDate(), current.getEndDate()) + 1;
        
        LocalDate previousEnd = current.getStartDate().minusDays(1);
        LocalDate previousStart = previousEnd.minusDays(daysBetween - 1);
        
        return new PeriodRange(previousStart, previousEnd);
    }
    
    /**
     * Get the number of days in the period
     */
    public long getDayCount() {
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }
}
