import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useEffect } from "react";

export default function Logout() {
  const navigate = useNavigate();
  const logout = useAuth("logout");

  useEffect(() => {
    const clearSession = async () => {
      try {
        const res = await logout();
        // console.log(res);
        if (res.status === 200) {
          navigate("/login");
        }
      } catch (error) {
        // console.error(error);
        return;
      }
    };

    clearSession();
  }, []);
}
