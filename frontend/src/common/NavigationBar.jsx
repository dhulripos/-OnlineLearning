import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/NavigationBar.css";
import logo from "../common/images/logo.png";
import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";

export default function NavigationBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Recoil
  const [userInfoRecoil, setUserInfoRecoil] = useRecoilState(authState);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="navbar">
      <div className="logo">
        <Link to={`/welcome`}>
          <img src={logo} alt="Logo" className="logo-img" />
        </Link>
        <Link to={`/welcome`} style={{ textDecoration: "none" }}>
          <span className="app-name">エコラン</span>
        </Link>
      </div>
      <div className="nav-links">
        <button onClick={() => navigate("/question/my-question-list")}>
          マイ学習リスト
        </button>
        <button onClick={() => navigate("/question/search")}>問題集検索</button>
        <button onClick={() => navigate("/question/create")}>問題集作成</button>
        <div className="user-menu">
          <button className="user-name" onClick={toggleMenu}>
            {userInfoRecoil && userInfoRecoil?.user?.name}
          </button>
          {menuOpen && (
            <div className="dropdown">
              <button onClick={() => navigate("/userinfo/edit")}>
                ユーザー情報変更
              </button>
              <button onClick={() => navigate("/logout")}>ログアウト</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
