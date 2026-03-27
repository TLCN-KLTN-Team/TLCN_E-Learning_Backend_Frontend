export interface CreditTransferApprovalRequest {
    status?: string;
    rejectionReason?: string;
    note?: string;
}

export interface ScheduleCreditTransferInterviewRequest {
    interviewScheduledAt: string;
    interviewMode: "ONLINE" | "OFFLINE";
    interviewMeetingLink?: string;
    interviewLocation?: string;
    note?: string;
}

export interface SubmitCreditTransferInterviewScoreRequest {
    certificateScore: number;
    interviewScore: number;
    interviewFeedback?: string;
}

export interface CreateCreditTransferRequest {
    equivalentCourseId: number;
    description: string;
    attachmentUrl: string;
    educationalUnitName?: string;
}
