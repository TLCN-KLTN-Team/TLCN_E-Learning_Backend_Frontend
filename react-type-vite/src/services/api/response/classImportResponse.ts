export interface ClassImportResponse {
  successful: number;
  failed: number;
  results: Array<{
    classCode: string;
    success: boolean;
    message: string;
  }>;
}
