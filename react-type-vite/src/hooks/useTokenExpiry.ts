// import { useEffect, useCallback } from "react";
// import { TokenUtils } from "../utils/tokenUtils";
// import { useAuth } from "@/context/auth-context/useAuth";

// export const useTokenExpiry = () => {
//   const { logout, isAuthenticated } = useAuth();

//   const checkTokenExpiry = useCallback(() => {
//     if (!isAuthenticated) return;

//     const authorizationDataJson = localStorage.getItem("authorizationData");
//     const authorizationData = authorizationDataJson
//       ? JSON.parse(authorizationDataJson)
//       : null;

//     if (!authorizationData) {
//       return;
//     }

//     const tokenExpiry = authorizationData.expiryTime;
//     const refreshTokenExpiry = authorizationData.refreshExpiryTime;

//     // Kiểm tra refresh token có hết hạn không
//     if (TokenUtils.isTokenExpired(refreshTokenExpiry)) {
//       console.log("Refresh token expired, logging out");
//       logout();
//       return;
//     }

//     // Kiểm tra access token có hết hạn không
//     if (TokenUtils.isTokenExpired(tokenExpiry)) {
//       console.log(
//         "Access token expired, will be refreshed automatically by axios interceptor"
//       );
//       // Axios interceptor sẽ tự động refresh token
//     }
//   }, [isAuthenticated, logout]);

//   useEffect(() => {
//     if (!isAuthenticated) return;

//     // Kiểm tra ngay khi component mount
//     checkTokenExpiry();

//     // Thiết lập interval để kiểm tra định kỳ (mỗi phút)
//     const interval = setInterval(checkTokenExpiry, 60000);

//     // Cleanup interval khi component unmount
//     return () => clearInterval(interval);
//   }, [isAuthenticated, checkTokenExpiry]);

//   // Thiết lập timeout để auto-logout khi refresh token sắp hết hạn
//   useEffect(() => {
//     if (!isAuthenticated) return;

//     const authorizationDataJson = localStorage.getItem("authorizationData");
//     const authorizationData = authorizationDataJson
//       ? JSON.parse(authorizationDataJson)
//       : null;

//     const refreshTokenExpiry = authorizationData.refreshExpiryTime;
//     if (!refreshTokenExpiry) return;

//     const timeUntilRefreshExpiry =
//       TokenUtils.getTimeUntilExpiry(refreshTokenExpiry);

//     if (timeUntilRefreshExpiry > 0) {
//       const timeout = setTimeout(() => {
//         console.log("Refresh token expired, auto-logout");
//         logout();
//       }, timeUntilRefreshExpiry);

//       return () => clearTimeout(timeout);
//     }
//   }, [isAuthenticated, logout]);
// };
