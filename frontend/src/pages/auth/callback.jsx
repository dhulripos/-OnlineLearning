// src/pages/auth/callback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoadingMotion from "../../utils/LoadingMotion";

const Callback = () => {
  const navigate = useNavigate();
  const login = useAuth("login"); // login関数を取得

  useEffect(() => {
    const fetchAuthData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code"); // Googleから送信された認証コード（code）を取得

      if (!code) {
        // console.error("No authorization code found");
        navigate("/");
        return;
      }

      try {
        // login関数を使って認証コードでログイン処理を実行
        await login(code);

        // ログイン後、ウェルカムページにリダイレクト
        navigate("/welcome");
      } catch (error) {
        // console.error("Error during authentication", error);
        navigate("/"); // 認証に失敗したら、ログイン画面にリダイレクト
      }
    };

    fetchAuthData();
  }, []);

  return <LoadingMotion />;
};

export default Callback;
