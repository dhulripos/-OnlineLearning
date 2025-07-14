import { googleAuthUrl } from "../utils/googleAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import logo from "../common/images/logo.png";
import "../css/GoogleLoginButton.css";

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  // すでにログイン済みの場合、ログイン後の画面にリダイレクト
  // クッキーからセッションIDを取得
  const cookies = document.cookie.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    cookies[name] = value;
    return cookies;
  }, {});

  const sessionID = cookies["session_id"];

  useEffect(() => {
    // クッキーにあるセッションIDが有効期限切れでなければ、ログイン後の画面にリダイレクト
    if (sessionID) {
      navigate("/welcome");
    }
  }, []);

  return (
    <div className="login-screen">
      <div className="login-container">
        <img src={logo} alt="Logo" className="login-logo" />
        <h1 className="login-title">エコランにログイン</h1>
        <a href={googleAuthUrl()} className="login-link">
          <button className="login-button">Googleでログイン</button>
        </a>
      </div>

      <style>
        {`
          body {
            padding: 0px;
          }
        `}
      </style>
    </div>
  );
};

export default GoogleLoginButton;
