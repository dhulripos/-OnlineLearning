import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
  key: "authStorage", // `localStorage` に保存されるキー名
  storage: localStorage, // or sessionStorage に変更も可能
});

export const authState = atom({
  key: "authState",
  default: {
    user: null,
    token: null, // JWT入れるところ
  },
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});
