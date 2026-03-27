export interface EquivalentCourseResponse {
    id: number;
    sourceCourseId: number;
    sourceCourseName: string;
    sourceCourseImage: string;
    sourceEducationalUnit: string;
    targetCourseId: number;
    targetCourseName: string;
    requirements: string;
    description: string;
    status: boolean;
    validFrom: string;
    validUntil: string;
    minQuizScore?: number;
    minAssignmentScore?: number;
    requiredRank?: string;
    certificateWeight?: number;
    interviewWeight?: number;
    approvalThreshold?: number;
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
}
