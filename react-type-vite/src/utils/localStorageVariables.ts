export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const getExpiryTime = () => {
  const expiryTime = localStorage.getItem("expiryTime");
  return expiryTime ? parseInt(expiryTime) : null;
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const getRefreshTokenExpiryTime = () => {
  const refreshExpiryTime = localStorage.getItem("refreshExpiryTime");
  return refreshExpiryTime ? parseInt(refreshExpiryTime) : null;
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
