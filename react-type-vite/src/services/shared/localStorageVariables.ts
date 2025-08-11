export const getAccessToken = () => {
  const authorizationData = localStorage.getItem("authorizationData");
  if (authorizationData) {
    try {
      const parsedData = JSON.parse(authorizationData);
      return parsedData.accessToken;
    } catch (error) {
      console.error("Error parsing authorizationData:", error);
      return null;
    }
  }
  return null;
};

export const getExpiryTime = () => {
  const authorizationData = localStorage.getItem("authorizationData");
  if (authorizationData) {
    try {
      const parsedData = JSON.parse(authorizationData);
      return parsedData.expiryTime;
    } catch (error) {
      console.error("Error parsing authorizationData:", error);
      return null;
    }
  }
  return null;
};

export const getRefreshToken = () => {
  const authorizationData = localStorage.getItem("authorizationData");
  if (authorizationData) {
    try {
      const parsedData = JSON.parse(authorizationData);
      return parsedData.refreshToken;
    } catch (error) {
      console.error("Error parsing authorizationData:", error);
      return null;
    }
  }
  return null;
};

export const getRefreshTokenExpiryTime = () => {
  const authorizationData = localStorage.getItem("authorizationData");
  if (authorizationData) {
    try {
      const parsedData = JSON.parse(authorizationData);
      return parsedData.refreshTokenExpiryTime;
    } catch (error) {
      console.error("Error parsing authorizationData:", error);
      return null;
    }
  }
  return null;
};
