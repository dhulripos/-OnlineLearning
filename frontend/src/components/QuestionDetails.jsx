import useQuestion from "../hooks/useQuestion";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import BackButton from "./BackButton";
import LoadingMotion from "../utils/LoadingMotion";

export default function QuestionDetails() {
  const getQuestionSet = useQuestion("getQuestionSet");
  const { id } = useParams();
  const registerMyQuestions = useQuestion("register my_questions");
  const ratingQuestionSet = useQuestion("rating");

  const [dateState, setDateState] = useState();
  const [rating, setRating] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 二重送信防止用
  const [isEvaluated, setIsEvaluated] = useState(false); // その問題を評価済みか

  // 問題集セットIDを元にデータを取得する
  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", { id }],
    queryFn: () => getQuestionSet(id),
  });

  const { mutate: submitRating } = useMutation({
    mutationFn: (data) => ratingQuestionSet(data),
    onSuccess: (res) => {
      // console.log("更新成功:", res);
      setIsEvaluated(true);
      questions[0].evaluate = res.data.evaluate;
    },
    onError: (error) => {
      // console.error("更新エラー:", error);
    },
  });

  // 更新処理
  const { mutate: register } = useMutation({
    mutationFn: (data) => registerMyQuestions(data),
    onMutate: () => {
      setIsSubmitting(true); // 送信開始時にボタンを無効化
    },
    onSuccess: (res) => {
      // console.log("更新成功:", res);
      setErrorMessage(""); // エラーをクリア
      setSuccessMessage("✅ 更新が成功しました！");
      questions[0].isRegistered = true;
      setRating(0);
    },
    onError: (error) => {
      // console.error("更新エラー:", error);
      if (error.status === 409) {
        setSuccessMessage(""); // 成功メッセージをクリア
        setErrorMessage(
          "❌ マイ学習リストに追加済みです。期限を修正する場合は、マイ学習リストから操作してください。"
        );
      } else {
        setSuccessMessage(""); // 成功メッセージをクリア
        setErrorMessage("❌ 更新に失敗しました。もう一度試してください。");
      }
    },
    onSettled: () => {
      setIsSubmitting(false); // 送信完了後にボタンを有効化
    },
  });

  // マイ学習リストに追加済みの問題を評価するハンドラー
  const handleRatingSubmit = () => {
    if (!questions || !questions[0] || !questions[0].isRegistered) {
      return;
    }

    if (rating < 1 || rating > 5) {
      return;
    }
    submitRating({ questionSetId: id, rating: rating });
  };

  // マイ学習リストに追加するハンドラー
  const handleRegister = () => {
    if (isSubmitting) return; // すでに送信中なら処理しない

    // 日付の設定を行なってもらってから登録処理
    if (!dateState) {
      setErrorMessage("期限を設定してマイ学習リストに追加してください。");
      return;
    }
    // 今日の日付よりも前だったら
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時間をリセットして日付のみ比較できるようにする
    if (new Date(dateState) < today) {
      setErrorMessage("期限には翌日以降を設定してください。");
      return;
    }

    register({ questionSetId: id, deadline: dateState });
  };

  if (!questions || !questions[0]) {
    return <LoadingMotion />;
  }

  return (
    <div className="container">
      {/* タイトルと公開範囲の選択 */}
      <div className="header">
        <h1>問題集詳細</h1>

        <Link
          to={`/question/answer/set/${id}`}
          style={{
            display: "inline-block",
            padding: "12px 24px",
            background: "linear-gradient(135deg, #4A90E2, #50E3C2)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            transition: "background 0.3s ease",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background =
              "linear-gradient(135deg, #3A78C2, #40D3A2)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background =
              "linear-gradient(135deg, #4A90E2, #50E3C2)")
          }
        >
          この問題集を回答する
        </Link>

        {/* マイ学習リストに追加するときのメッセージ */}
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

        {/* マイ学習リストに追加している問題を評価する */}
        {!isEvaluated &&
        !questions[0]?.isEvaluated &&
        questions[0]?.isRegistered ? (
          <div style={{ display: "flex" }}>
            <h4>問題集を評価する</h4>
            <div style={{ marginTop: "5px", marginLeft: "10px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "2rem",
                    cursor: "pointer",
                    color: rating >= star ? "#ffd700" : "#ccc",
                  }}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <button
              style={{
                marginLeft: "10px",
                padding: "0px 12px", // パディングを調整してコンパクトに
                width: "fit-content", // コンテンツに合わせた幅に
                fontSize: "14px", // フォントサイズも必要に応じて調整
                border: "1px solid #ccc",
                borderRadius: "10px",
                backgroundColor: "#fff",
                cursor: "pointer",
              }}
              onClick={handleRatingSubmit}
              disabled={isLoading}
            >
              評価を送信
            </button>
          </div>
        ) : (
          // 問題集を評価済みの場合
          <div style={{ display: "flex" }}>
            <h4>あなたがつけた評価</h4>
            <div style={{ marginTop: "5px", marginLeft: "10px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{
                    fontSize: "2rem",
                    opacity: "50%",
                    color: questions[0]?.evaluate >= star ? "#ffd700" : "#ccc",
                  }}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )}

        {!isLoading && questions[0]?.isRegistered ? (
          <div
            style={{
              padding: "16px 24px",
              background: "linear-gradient(135deg, #ffe259, #ffa751)",
              color: "#5a3e1b",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "12px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              display: "inline-block",
            }}
          >
            マイ学習リスト登録済み
          </div>
        ) : (
          <div style={{ display: "flex" }}>
            <button
              onClick={handleRegister}
              style={{
                marginRight: "20px",
                background: "linear-gradient(135deg, #32a1ce, #5bc0de)",
                border: "none",
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                padding: "12px 24px",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s ease-in-out",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              }}
              onMouseOver={(e) =>
                (e.target.style.background =
                  "linear-gradient(135deg, #2a91b8, #4aa3c7)")
              }
              onMouseOut={(e) =>
                (e.target.style.background =
                  "linear-gradient(135deg, #32a1ce, #5bc0de)")
              }
            >
              マイ学習リストに追加
            </button>
            <label style={{ marginRight: "5px" }}>目標期限</label>
            <input
              type="date"
              style={{ width: "auto" }}
              value={dateState}
              onChange={(e) => setDateState(e.target.value)}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          width: "100%",
        }}
      >
        <div style={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <label style={{ whiteSpace: "nowrap", marginBottom: "15px" }}>
            問題集タイトル
          </label>
          <input
            style={{
              marginLeft: "15px",
              flexGrow: 1,
              padding: "8px",
              width: "100%",
            }}
            type="text"
            value={!isLoading && questions[0]?.title}
            disabled={true}
          />
        </div>
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <label style={{ whiteSpace: "nowrap" }}>ジャンル</label>
          <select
            style={{
              marginLeft: "15px",
              flexGrow: 1,
              padding: "8px",
              width: "100%",
            }}
            disabled={true}
          >
            <option>{!isLoading && questions[0]?.genreName}</option>
          </select>
        </div>
      </div>

      <div className="form-container">
        {!isLoading &&
          questions?.map((q) => (
            <div key={q.id} className="question-set">
              <label>問題文</label>
              <textarea
                style={{ width: "98%", resize: "none" }}
                type="text"
                value={q.question}
                disabled={true}
              />

              <label>答えと選択肢</label>
              <div className="answer-group">
                <input type="text" value={`答え:${q.answer}`} disabled={true} />
                <input type="text" value={q.choices1} disabled={true} />
                <input type="text" value={q.choices2} disabled={true} />
              </div>
            </div>
          ))}
      </div>
      <BackButton />
    </div>
  );
}
