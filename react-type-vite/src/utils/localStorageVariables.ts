export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const getRoles = () => {
  const roles = localStorage.getItem("roles");
  if (roles) {
    try {
      return JSON.parse(roles);
    } catch (error) {
      console.error("Error parsing roles:", error);
      return null;
    }
  }
  return null;
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("roles");
};
