export interface CertificateResponse {
    id: number;
    userId: string;
    courseId: number;
    certificateCode: string;
    issueDate: string;
    transactionHash: string;
    contractAddress: string;
    blockNumber: number;
    status: "PENDING" | "ISSUED" | "FAILED";
    finalScore?: number;
    grade?: string;
}
