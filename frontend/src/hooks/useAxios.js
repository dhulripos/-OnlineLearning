import axios from "axios";
import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";

export default function useAxios() {
  const [auth, setAuthState] = useRecoilState(authState);
  const token = auth?.token; // JWTを取得（nullチェック）

  const ax = axios.create({
    baseURL: "http://localhost:8080/api/",
    withCredentials: true, // クッキーを含める場合はtrue
    headers: {
      Authorization: token ? `Bearer ${token}` : "", // JWTをヘッダーにセット
    },
  });

  return ax;
}
