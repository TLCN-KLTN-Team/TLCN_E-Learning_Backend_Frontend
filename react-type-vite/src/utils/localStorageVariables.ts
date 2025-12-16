export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

// DEPRECATED: Không sử dụng nữa - Role lấy từ JWT token
// Giữ lại để tránh break code cũ, nhưng sẽ return null
export const getRoles = () => {
  console.warn(
    "getRoles() is deprecated. Use getAuthInfo() from auth.utils.ts instead"
  );
  return null;
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("expiryTime");
  localStorage.removeItem("refreshExpiryTime");
};
