import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
  key: "questionStorage", // `localStorage` に保存されるキー名
  storage: localStorage, // or sessionStorage に変更も可能
});

// 問題集検索の検索条件を保持するアトム
export const questionSearchStorage = atom({
  key: "questionSearchStorage",
  default: {
    title: "",
    visibility: "private",
    genreId: 1,
  },
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});

// 問題集検索の検索条件を保持するアトム
export const filterFavoriteQuestionStorage = atom({
  key: "filterFavoriteQuestionStorage",
  default: {
    title: "",
    visibility: "private",
    genreId: 1,
  },
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});

// マイ学習リストの絞り込み条件を保持するアトム
export const myQuestionSearchStorage = atom({
  key: "myQuestionSearchStorage",
  default: {
    title: "",
    genreId: 0,
    status: "",
  },
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});

// 問題集修正-検索の絞り込み条件を保持するアトム
export const myCreatedQuestionSearchStorage = atom({
  key: "myCreatedQuestionSearchStorage",
  default: {
    title: "",
    genreId: 0,
  },
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});
