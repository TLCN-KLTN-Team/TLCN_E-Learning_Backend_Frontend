import { jwtDecode } from "jwt-decode";

// Interface cho decoded JWT token
interface DecodedToken {
  sub: string;
  iss: string;
  exp: number;
  iat: number;
  jti: string;
  token_type: string;
  scope: string;
}

// Interface cho auth info trả về
export interface AuthInfo {
  role: string;
  exp: number;
  userId?: string;
}

/**
 * Decode JWT token và lấy thông tin role từ scope
 * @returns AuthInfo hoặc null nếu token không hợp lệ
 */
export const getAuthInfo = (): AuthInfo | null => {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);

    // Lấy role từ scope (thường là ROLE_STUDENT, ROLE_TEACHER, etc.)
    const scope = decoded.scope;

    console.log("Decoded role from token:", scope);

    if (!scope) {
      console.warn("No valid role found in token");
      return null;
    }

    return {
      role: scope, // STUDENT, TEACHER, ADMIN, SUPER_ADMIN, USER
      exp: decoded.exp,
      userId: decoded.sub,
    };
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

/**
 * Kiểm tra token có hết hạn chưa
 * @returns true nếu token còn hạn
 */
export const isTokenValid = (): boolean => {
  const authInfo = getAuthInfo();
  if (!authInfo) return false;

  const currentTime = Math.floor(Date.now() / 1000);
  return authInfo.exp > currentTime;
};
