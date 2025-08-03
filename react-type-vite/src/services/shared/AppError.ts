import type { ErrorResponse } from "./apiResponse";

export class AppError extends Error {
  public code: number;
  public errors?: Record<string, string>;

  constructor(errorResponse: ErrorResponse) {
    super(errorResponse.message);
    this.name = "AppError";
    this.code = errorResponse.code;
    this.errors = errorResponse.errors;
  }

  public isAuthError(): boolean {
    return this.code >= 1007 && this.code <= 1010;
  }

  public isTokenExpired(): boolean {
    return this.code === 1009;
  }

  public getDisplayMessage(): string {
    if (this.errors && Object.keys(this.errors).length > 0) {
      return Object.values(this.errors).join(", ");
    }
    return this.message;
  }
}
