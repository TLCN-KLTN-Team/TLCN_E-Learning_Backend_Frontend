export const OAuth2Utils = {
  callBackUrl: `${import.meta.env.VITE_APP_URL}/auth/google/callback`,
  authUri: "https://accounts.google.com/o/oauth2/v2/auth",
  googleClientId:
    "640462026448-rlhcjv1mabvntcurk2mbuh39757jvc9i.apps.googleusercontent.com",
};

export const FacebookOAuth2Utils = {
  fbAuthUri: "https://www.facebook.com/v24.0/dialog/oauth",
  fbClientId: "1956680224907942", // Replace with your Facebook App ID
  fbRedirectUri: `${import.meta.env.VITE_APP_URL}/auth/facebook/callback`, // Replace with your redirect URI
};
