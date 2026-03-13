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
    status: string; // PENDING, APPROVED, REJECTED
    requestDate: string;

    approvedById: string;
    approvedDate: string;
    rejectionReason: string;
}


