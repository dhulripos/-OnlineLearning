import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist({
  key: "questionStorage", // `localStorage` に保存されるキー名
  storage: localStorage, // or sessionStorage に変更も可能
});

// 問題集検索から別の画面に行って、そこから戻るボタンで帰ってくる時に使用するアトム
export const QuestionSearchPageBackStorage = atom({
  key: "QuestionSearchPageBackStorage",
  default: 1,
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});

// マイ学習リストから別の画面に行って、そこから戻るボタンで帰ってくる時に使用するアトム
export const MyQuestionPageBackStorage = atom({
  key: "MyQuestionPageBackStorage",
  default: 1,
  effects_UNSTABLE: [persistAtom], // 状態を永続化
});
