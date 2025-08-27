import type { ErrorResponse } from "@/types/error/ErrorResponse";
import { typeError } from "./typeError";

export class AppError extends Error {
  public code: string;
  public errors?: Record<string, string>;

  constructor(errorResponse: ErrorResponse) {
    super(errorResponse.message);
    this.name = "AppError";
    this.code = errorResponse.code;
    this.errors = errorResponse.errors;
  }

  public isAuthError(): boolean {
    return this.code.startsWith("AUTH_");
  }

  public isValidationError(): boolean {
    return this.code.startsWith("VALID_");
  }

  public isTokenExpired(): boolean {
    return this.code === "TOKEN_EXPIRED";
  }

  public getDisplayMessage(): string {
    if (this.errors && Object.keys(this.errors).length > 0) {
      return Object.values(this.errors).join(", ");
    }
    return this.message;
  }

  public getErrorType(): string {
    if (this.isValidationError()) return typeError.WARNING;
    if (this.isAuthError()) return typeError.ERROR;
    if (this.isTokenExpired()) return typeError.ERROR;
    return typeError.ERROR;
  }
}
