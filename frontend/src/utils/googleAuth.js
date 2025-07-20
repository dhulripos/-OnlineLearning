// src/utils/googleAuth.js
export const googleAuthUrl = () => {
  const clientId =
    "1011488123966-s8n27t0v2uh8j4jff352cmj9bbrm73qk.apps.googleusercontent.com"; // Google Client ID
  const redirectUri = "http://localhost:3000/auth/callback"; // リダイレクトURL
  const scope = "openid profile email"; // 必要なスコープ

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  return authUrl;
};
