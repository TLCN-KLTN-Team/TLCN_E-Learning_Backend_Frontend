export const TokenUtils = {
  /**
   * Kiểm tra token có hết hạn không
   */
  isTokenExpired: (expiryTime: string | null): boolean => {
    if (!expiryTime) return true;
    const expiry = parseInt(expiryTime);
    return Date.now() >= expiry;
  },

  /**
   * Kiểm tra token sắp hết hạn (trong vòng 5 phút)
   */
  isTokenExpiringSoon: (expiryTime: string | null): boolean => {
    if (!expiryTime) return true;
    const expiry = parseInt(expiryTime);
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= expiry - fiveMinutes;
  },

  /**
   * Lấy thời gian còn lại của token (milliseconds)
   */
  getTimeUntilExpiry: (expiryTime: string | null): number => {
    if (!expiryTime) return 0;
    const expiry = parseInt(expiryTime);
    return Math.max(0, expiry - Date.now());
  },

  /**
   * Clear tất cả auth tokens
   */
  clearTokens: (): void => {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("refreshTokenExpiry");
  },

  /**
   * Kiểm tra có token không
   */
  hasValidTokens: (): boolean => {
    const token = localStorage.getItem("jwt");
    const tokenExpiry = localStorage.getItem("tokenExpiry");

    if (!token || !tokenExpiry) return false;

    return !TokenUtils.isTokenExpired(tokenExpiry);
  },
};
