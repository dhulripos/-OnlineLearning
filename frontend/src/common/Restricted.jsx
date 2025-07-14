// import { useRecoilValue } from "recoil";
// import { authState } from "../recoils/authState";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";

export default function Restricted({ children }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useRecoilState(authState);

  // クッキーからセッションIDを取得
  const cookies = document.cookie.split(";").reduce((cookies, cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    cookies[name] = value;
    return cookies;
  }, {});

  const sessionID = cookies["session_id"];

  useEffect(() => {
    // クッキーにあるセッションIDが有効期限切れであれば、ログイン画面へ遷移させる
    if (!sessionID) {
      navigate("/");
    }
    if (!auth?.user) {
      navigate("/");
    }
  }, [auth, sessionID]);

  return <div>{children}</div>;
}
