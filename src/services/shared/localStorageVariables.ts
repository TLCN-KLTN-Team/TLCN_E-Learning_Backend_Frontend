const authorizationData = localStorage.getItem("authorizationData");

export const getAccessToken = () => {
  if (authorizationData) {
    const parsedData = JSON.parse(authorizationData);
    return parsedData.accessToken;
  }
  return null;
};
