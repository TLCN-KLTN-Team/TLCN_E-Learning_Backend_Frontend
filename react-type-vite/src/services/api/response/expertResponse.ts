export interface ExpertResponse {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    expertId: string;
    educationalUnitId: string;
    description?: string;
    accountStatus: string;
    avatarUrl?: string;
    phoneNumber?: string;
    bio?: string;
    // department?: DepartmentResponse; // Experts might not have department
}

export interface ExpertRequest {
    username: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    expertId: string;
    description?: string;
    educationalUnitId?: string;
    accountStatus?: string;
}
