import { useRecoilValue } from "recoil";
import { authState } from "../recoils/auth";
import axios from "axios";
import { useEffect, useState } from "react";

export const useFetchUser = () => {
  const { token } = useRecoilValue(authState);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const response = await axios.get("http://localhost:8080/user", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        // console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  return user;
};
