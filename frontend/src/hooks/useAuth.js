import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";
import useAuthAxios from "../hooks/useAxios";

export default function useAuth(action) {
  const [auth, setAuthState] = useRecoilState(authState);
  const axios = useAuthAxios();
  switch (action) {
    case "login":
      return async (code) => Login(axios, code, setAuthState);
    case "logout":
      return async () => Logout(axios, setAuthState);
  }
}

async function Login(axios, code, setAuthState) {
  try {
    const res = await axios.post(`/auth/login?code=${code}`);

    // Recoil にユーザー情報とトークンを保存
    setAuthState({
      user: res.data.user,
      token: res.data.token,
    });
  } catch (error) {
    // console.error("Login failed", error);
  }
}

// ログアウト処理（状態をリセット）
async function Logout(axios, setAuthState) {
  try {
    // クッキーからセッションIDを取得
    const cookies = document.cookie.split(";").reduce((cookies, cookie) => {
      const [name, value] = cookie.split("=").map((c) => c.trim());
      cookies[name] = value;
      return cookies;
    }, {});
    const sessionID = cookies["session_id"];

    // セッションIDのクッキーをクリア
    if (sessionID) {
      document.cookie =
        "session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    // 認証状態をリセット
    setAuthState({ user: null, token: null });

    const res = await axios.post(`/auth/logout?session_id=${sessionID}`);
    return res;
  } catch (error) {
    return error;
  }
}
