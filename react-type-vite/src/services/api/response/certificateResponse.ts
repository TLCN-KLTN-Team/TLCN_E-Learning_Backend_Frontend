export interface CertificateResponse {
    id: number;
    userId: string;
    studentName?: string;
    courseId: number;
    courseName?: string;
    certificateCode: string;
    issueDate: string;
    transactionHash: string;
    contractAddress: string;
    blockNumber: number;
    status: "PENDING" | "ISSUED" | "FAILED";
    finalScore?: number;
    grade?: string;
    certificateHash?: string;
    pdfHash?: string;
    pdfUrl?: string;
    tokenUri?: string;
    tokenId?: string;
}
