import axios from "axios";

export default function useAxios() {
  const ax = axios.create({
    baseURL: "http://localhost:8080/api/",
    withCredentials: true, // クッキーを含める場合はtrue
  });

  return ax;
}
