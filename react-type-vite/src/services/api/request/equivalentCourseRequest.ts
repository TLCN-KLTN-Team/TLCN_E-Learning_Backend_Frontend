export interface EquivalentCourseRequest {
    sourceCourseId: number;
    targetCourseId: number;
    requirements?: string;
    description?: string;
    status?: boolean;
    validFrom?: string;
    validUntil?: string;
    minQuizScore?: number;
    minAssignmentScore?: number;
    requiredRank?: string;
}
