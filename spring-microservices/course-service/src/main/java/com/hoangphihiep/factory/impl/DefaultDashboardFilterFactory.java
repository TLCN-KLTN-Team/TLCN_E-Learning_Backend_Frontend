package com.hoangphihiep.factory.impl;

import com.hoangphihiep.dto.request.DashboardFilterRequest;
import com.hoangphihiep.factory.DashboardFilterFactory;
import com.hoangphihiep.utils.EducationType;
import com.hoangphihiep.utils.PeriodType;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Component
public class DefaultDashboardFilterFactory implements DashboardFilterFactory {
    @Override
    public DashboardFilterRequest from(PeriodType period, EducationType educationType) {
        DashboardFilterRequest filter = new DashboardFilterRequest();
        filter.setPeriod(period);
        filter.setEducationType(educationType);

        LocalDate today = LocalDate.now();

        switch (period) {
            case WEEK -> {
                filter.setFrom(today.with(DayOfWeek.MONDAY));
                filter.setTo(today);
            }
            case MONTH -> {
                filter.setFrom(today.withDayOfMonth(1));
                filter.setTo(today);
            }
            case YEAR -> {
                filter.setFrom(today.withDayOfYear(1));
                filter.setTo(today);
            }
            case CUSTOM -> {
                // from/to sẽ set riêng ở controller
            }
        }

        return filter;
    }
}
