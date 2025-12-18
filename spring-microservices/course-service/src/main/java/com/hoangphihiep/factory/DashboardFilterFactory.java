package com.hoangphihiep.factory;

import com.hoangphihiep.dto.request.DashboardFilterRequest;
import com.hoangphihiep.utils.EducationType;
import com.hoangphihiep.utils.PeriodType;

public interface DashboardFilterFactory {
    DashboardFilterRequest from(PeriodType period, EducationType educationType);
}
