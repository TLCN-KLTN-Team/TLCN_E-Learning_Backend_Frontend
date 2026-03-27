export interface CreditTransferResponse {
    id: number;
    studentId: string;
    studentName: string;

    sourceCourseName: string;
    sourceCourseId: number;

    targetCourseId: number;
    targetCourseName: string;

    equivalentCourseId: number;
    equivalentCourseRequirements: string;
    equivalentCourseDescription: string;

    description: string;
    attachmentUrl: string;
    status: "PENDING" | "INTERVIEW_SCHEDULED" | "INTERVIEW_SCORED" | "PENDING_EXPERT_REVIEW" | "APPROVED" | "REJECTED";
    requestDate: string;

    interviewTeacherId?: string;
    interviewScheduledAt?: string;
    interviewMode?: "ONLINE" | "OFFLINE";
    interviewMeetingLink?: string;
    interviewLocation?: string;
    interviewFeedback?: string;
    interviewScoredAt?: string;

    certificateScore?: number;
    interviewScore?: number;
    decisionScore?: number;
    certificateWeightApplied?: number;
    interviewWeightApplied?: number;
    approvalThresholdApplied?: number;
    decisionReason?: string;

    approvedById?: string;
    approvedDate?: string;
    rejectionReason?: string;
}


