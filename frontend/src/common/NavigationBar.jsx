import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../css/NavigationBar.css";
import logo from "../common/images/logo.png";
import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";

export default function NavigationBar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
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
        <button
          className={
            location?.pathname === "/question/my-question-list" ? "active" : ""
          }
          onClick={() => navigate("/question/my-question-list")}
        >
          マイ学習リスト
        </button>
        <button
          className={location?.pathname === "/question/search" ? "active" : ""}
          onClick={() => navigate("/question/search")}
        >
          問題集検索
        </button>
        <button
          className={location?.pathname === "/question/create" ? "active" : ""}
          onClick={() => navigate("/question/create")}
        >
          問題集作成
        </button>
        <button
          className={
            location?.pathname === "/question/fix/search" ? "active" : ""
          }
          onClick={() => navigate("/question/fix/search")}
        >
          問題集修正
        </button>
        <div className="user-menu">
          <button
            className={
              location?.pathname === "/userinfo/edit"
                ? "active user-name"
                : "user-name"
            }
            onClick={toggleMenu}
          >
            {userInfoRecoil && userInfoRecoil?.user?.name}
          </button>
          {menuOpen && (
            <div className="dropdown">
              <button
                className={
                  location?.pathname === "/userinfo/edit" ? "active" : ""
                }
                onClick={() => navigate("/userinfo/edit")}
              >
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
