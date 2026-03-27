package com.hoangphihiep.dto.request;

import com.hoangphihiep.utils.InterviewMode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleCreditTransferInterviewRequest {
    private LocalDateTime interviewScheduledAt;
    private InterviewMode interviewMode;
    private String interviewMeetingLink;
    private String interviewLocation;
    private String note;
}
