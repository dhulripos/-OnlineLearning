import useQuestion from "../hooks/useQuestion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import "../css/AnswerQuestion.css";
import BackButton from "./BackButton";

export default function AnswerQuestion() {
  const getQuestionSet = useQuestion("getQuestionSet");
  const { id } = useParams();
  const submitQuestions = useQuestion("submit");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // 二重送信防止用

  const [shuffledChoices, setShuffledChoices] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const questionRefs = useRef([]);

  const navigate = useNavigate();

  // 問題集セットIDを元にデータを取得する
  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", { id }],
    queryFn: () => getQuestionSet(id),
  });

  // 正誤判定を行うバックエンドに処理を流す
  const { mutate: submit } = useMutation({
    mutationFn: (data) => submitQuestions(data),
    onMutate: () => {
      setIsSubmitting(true); // 送信開始時にボタンを無効化
    },
    onSuccess: (res) => {
      // console.log("更新成功:", res);
      setErrorMessage(""); // エラーをクリア
      setSuccessMessage("✅ 提出に成功しました！");
      navigate(`/question/submit/results/${res.submissionId}`);
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

  // マイ学習リストに追加するハンドラー
  const handleSubmit = () => {
    if (isSubmitting) return; // すでに送信中なら処理しない

    // questionSetIdと回答を送信する
    submit({ questionSetId: id, questions: selectedAnswers });
  };

  useEffect(() => {
    if (questions) {
      const shuffled = questions.map((q) => {
        const choices = [q.answer, q.choices1, q.choices2];
        const shuffledChoices = shuffleArray(choices);
        return shuffledChoices;
      });

      setShuffledChoices(shuffled);

      // 初期値として左端の選択肢をセット
      const initialAnswers = questions.reduce((acc, q, index) => {
        acc[q.id] = shuffled[index][0]; // 左端の選択肢
        return acc;
      }, {});

      setSelectedAnswers(initialAnswers);

      // 各質問の要素を参照できるように配列を初期化
      questionRefs.current = new Array(questions.length).fill(null);
    }
  }, [questions]);

  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const handleAnswerChange = (questionId, choice) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choice,
    }));

    // 次の問題へスクロール
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    const nextQuestionIndex = questionIndex + 1;
    if (nextQuestionIndex < questions.length) {
      questionRefs.current[nextQuestionIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div className="question-answer-container">
      {/* タイトルと公開範囲の選択 */}
      <div className="question-answer-header">
        <h1>問題集回答</h1>
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
        <h4 style={{ textDecoration: "underline" }}>
          ※ページを戻ったりリロードすると回答内容がリセットされるため、ご注意ください。
        </h4>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          gap: "20px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ whiteSpace: "nowrap", marginBottom: "15px" }}>
            問題集タイトル：
          </label>
          <h1
            style={{
              flexGrow: 1,
              padding: "8px",
              width: "30%",
            }}
            type="text"
          >
            {!isLoading && questions[0]?.title}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <label style={{ whiteSpace: "nowrap" }}>ジャンル：</label>
          <h1
            style={{
              flexGrow: 1,
              padding: "8px",
              width: "30%",
              marginTop: "25px",
            }}
            disabled={true}
          >
            {!isLoading && questions[0]?.genreName}
          </h1>
        </div>
      </div>

      <div className="question-answer-container">
        {questions?.map((q, index) => (
          <div
            key={q.id}
            className="question-block"
            ref={(el) => (questionRefs.current[index] = el)}
          >
            <h2 className="question-text">{q.question}</h2>
            <div className="choices">
              {shuffledChoices[index]?.map((choice, i) => (
                <label
                  key={i}
                  className={`choice-label ${
                    selectedAnswers[q.id] === choice ? "checked" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={choice}
                    checked={selectedAnswers[q.id] === choice}
                    onChange={() => handleAnswerChange(q.id, choice)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 回答を提出ボタン */}
      <div className="question-answer-submit">
        <button
          className="question-answer-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "送信中..." : "回答を提出"}
        </button>
      </div>

      {/* BackButton を画面左下に固定表示 */}
      <div
        style={{
          position: "fixed",
          left: "20px",
          bottom: "20px",
          zIndex: 1000,
        }}
      >
        <BackButton />
      </div>
    </div>
  );
}
