export interface CreditTransferApprovalRequest {
    status?: string;
    rejectionReason?: string;
    note?: string;
}

export interface CreateCreditTransferRequest {
    equivalentCourseId: number;
    description: string;
    attachmentUrl: string;
    educationalUnitName?: string;
}
