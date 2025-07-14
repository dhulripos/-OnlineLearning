import "../css/EditUserInfo.css";
import useUserInfo from "../hooks/useUserInfo";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { authState } from "../recoils/authState";

export default function EditUserInfo() {
  const updateUserInfo = useUserInfo("edit");
  const getUserInfo = useUserInfo("get");

  // ユーザー情報更新後にRecoilのユーザー名を更新するために使用する
  const [userInfoRecoil, setUserInfoRecoil] = useRecoilState(authState);

  // フォームの状態管理
  const [formData, setFormData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 二重送信防止用

  // 検索実行
  const { data, isLoading: userIsLoading } = useQuery({
    queryKey: ["userInfo"],
    queryFn: () => getUserInfo(),
    staleTime: 0, // キャッシュを無効化
    cacheTime: 0, // キャッシュを保持しない
  });

  // データが取得されたらフォームデータを更新
  useEffect(() => {
    if (data?.userInfo) {
      setFormData({
        name: data?.userInfo.userName,
        era: data?.userInfo.era,
        occupationId: data?.userInfo.occupationId,
      });
    }
  }, [data]);

  // 更新処理
  const { mutate: editUserInfo } = useMutation({
    mutationFn: (data) => updateUserInfo(data),
    onMutate: () => {
      setIsSubmitting(true); // 送信開始時にボタンを無効化
    },
    onSuccess: (res) => {
      // console.log("更新成功:", res);
      setErrorMessage(""); // エラーをクリア
      setSuccessMessage("✅ 更新が成功しました！");
      // Recoilの状態を更新する
      setUserInfoRecoil((prevState) => ({
        ...prevState,
        // userがnullの場合も考慮し、スプレッド演算子で前の状態を保持
        user: {
          ...prevState.user,
          name: res.data.userName, // APIから取得した新しい名前を設定
        },
      }));
    },
    onError: (error) => {
      // console.error("更新エラー:", error);
      setSuccessMessage(""); // 成功メッセージをクリア
      setErrorMessage("❌ 更新に失敗しました。もう一度試してください。");
    },
    onSettled: () => {
      setIsSubmitting(false); // 送信完了後にボタンを有効化
    },
  });

  // フォームの変更イベント
  const handleChange = (e) => {
    if (isSubmitting) return; // 送信中は変更を受け付けない
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "era" || name === "occupationId" ? Number(value) : value,
    });
  };

  // バリデーション & 更新処理
  const handleSubmit = () => {
    if (isSubmitting) return; // すでに送信中なら処理しない

    if (!formData.name.trim()) {
      setErrorMessage("⚠️ 名前を入力してください");
      setSuccessMessage(""); // 成功メッセージをクリア
      return;
    }

    editUserInfo(formData);
  };

  return (
    <div className="edit-user-container">
      <h1 className="title">ユーザー情報変更</h1>
      <form className="edit-user-form">
        <div className="form-group">
          <label>名前：</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            disabled={isSubmitting} // 送信中は編集不可
          />
        </div>
        <div className="form-group">
          <label>年代：</label>
          <select
            name="era"
            value={Number(formData.era)}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            disabled={isSubmitting} // 送信中は編集不可
          >
            <option value="">なし</option>
            <option value="10">10代</option>
            <option value="20">20代</option>
            <option value="30">30代</option>
            <option value="40">40代</option>
            <option value="50">50代</option>
            <option value="60">60代以上</option>
          </select>
        </div>
        <div className="form-group">
          <label>職業：</label>
          <select
            name="occupationId"
            value={formData.occupationId}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            disabled={isSubmitting} // 送信中は編集不可
          >
            {userIsLoading ? (
              <option>Loading...</option>
            ) : (
              data?.occupations?.map((occupation) => (
                <option key={occupation.id} value={occupation.id}>
                  {occupation.name}
                </option>
              ))
            )}
          </select>
        </div>
        {errorMessage && (
          <p
            className="error-message"
            style={{ fontWeight: "bold", color: "red" }}
          >
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p
            className="success-message"
            style={{ fontWeight: "bold", color: "green" }}
          >
            {successMessage}
          </p>
        )}
        <button
          type="button"
          className="save-button"
          onClick={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          disabled={isSubmitting} // 送信中はボタンを無効化
        >
          {isSubmitting ? "保存中..." : "変更を保存する"}
        </button>
      </form>
    </div>
  );
}
