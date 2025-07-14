import { useEffect, useState } from "react";
import "../css/CreateQuestion.css";
import useGenre from "../hooks/useGenre";
import useQuestion from "../hooks/useQuestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import BackButton from "./BackButton";

export default function CreateQuestion() {
  const [visibility, setVisibility] = useState("private");
  const [genre, setGenre] = useState(1);
  const [title, setTitle] = useState(""); // 問題集のタイトルを管理
  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      genreId: Number(genre),
      visibility: visibility,
      question: "",
      answer: "",
      choices1: "",
      choices2: "",
    },
  ]);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const getAllGenres = useGenre("all");
  const insertQuestion = useQuestion("insert");

  // 公開範囲やジャンルが変更されたら、現在の `questions` に適用
  useEffect(() => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        genreId: Number(genre),
        visibility: visibility,
      }))
    );
  }, [genre, visibility]);

  // 入力値を変更
  const handleInputChange = (id, field, value) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
    setErrors((prev) => ({ ...prev, [`${id}-${field}`]: "" }));
  };

  // 問題セットを追加
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now(),
        genreId: Number(genre),
        visibility: visibility,
        question: "",
        answer: "",
        choices1: "",
        choices2: "",
      },
    ]);
  };

  // 問題セットを削除
  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  // バリデーションチェック
  const validate = () => {
    let newErrors = {};

    // タイトルの入力チェック
    if (title.trim() === "") {
      newErrors["title"] = "タイトルは必須です";
    }

    questions.forEach((q) => {
      // 必須チェック & 文字数制限
      ["question", "answer", "choices1", "choices2"].forEach((field) => {
        if (!q[field].trim()) newErrors[`${q.id}-${field}`] = "必須項目です";
        if (q[field].length > 1000)
          newErrors[`${q.id}-${field}`] = "1000文字以内で入力してください";
      });

      // 重複チェック
      const choicesSet = new Set(
        [q.answer, q.choices1, q.choices2].map((s) => s.trim())
      );
      if (choicesSet.size !== 3) {
        newErrors[`${q.id}-answer`] = "答えと選択肢が重複しています";
        newErrors[`${q.id}-choices1`] = "答えと選択肢が重複しています";
        newErrors[`${q.id}-choices2`] = "答えと選択肢が重複しています";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 問題の更新用関数
  const { mutate: insertMutate, isLoading: insertLoading } = useMutation({
    mutationFn: (data) => insertQuestion(data),
    onSuccess: (res) => {
      // console.log(res);
      // サーバーからのメッセージを取得
      if (res.status === 200) {
        setSuccessMessage("問題を作成しました (" + res.data.count + "件)");
      } else {
        setSuccessMessage("問題を作成しました");
      }

      // 5秒後にメッセージを消す
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      setTitle("");

      // フォームをリセット
      setQuestions([
        {
          id: Date.now(),
          genreId: Number(genre),
          visibility: visibility,
          question: "",
          answer: "",
          choices1: "",
          choices2: "",
        },
      ]);
      setErrors({});
    },
    onError: (error) => {
      // console.error("更新エラー:", error);
    },
  });

  // 作成ボタン押下時の処理
  const handleCreate = () => {
    if (!validate()) return;
    if (insertLoading) return; // 二重送信防止

    // 不要な `id` を削除して送信
    const payload = questions.map(({ id, ...rest }) => rest);

    const data = { questions: payload, title: title };
    insertMutate(data);
  };

  const { data: genres, isLoading } = useQuery({
    queryKey: ["genres", {}],
    queryFn: () => getAllGenres(),
  });

  return (
    <div className="container">
      {/* 成功メッセージの表示 */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {/* タイトルと公開範囲の選択 */}
      <div className="header">
        <h1>問題集作成</h1>
        <div className="select-group">
          <label style={{ whiteSpace: "nowrap" }}>ジャンルを選択：</label>
          <select
            className="visibility-select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="private">プライベート</option>
            <option value="public">パブリック</option>
          </select>
          <select
            className="genre-select"
            value={Number(genre)}
            onChange={(e) => setGenre(Number(e.target.value))}
          >
            {isLoading ? (
              <option>Loading...</option>
            ) : (
              genres?.data?.genres?.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* 問題集 */}
      <div className="question-title">
        <label>問題集タイトル</label>
        <input
          style={{ marginLeft: "15px" }}
          type="text"
          placeholder="問題集タイトルを入力"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {errors[`title`] && (
          <span className="error-text">{errors[`title`]}</span>
        )}
      </div>

      <div className="form-container">
        {questions.map((q) => (
          <div key={q.id} className="question-set">
            {/* ×ボタン */}
            <button className="delete-btn" onClick={() => removeQuestion(q.id)}>
              ×
            </button>

            <label>問題文</label>
            <textarea
              style={{ width: "96%" }}
              type="text"
              value={q.question}
              onChange={(e) =>
                handleInputChange(q.id, "question", e.target.value)
              }
              placeholder="問題文を入力"
              className={errors[`${q.id}-question`] ? "error" : ""}
            />
            {errors[`${q.id}-question`] && (
              <span className="error-text">{errors[`${q.id}-question`]}</span>
            )}

            <label>答えと選択肢</label>
            <div className="answer-group">
              <input
                type="text"
                value={q.answer}
                onChange={(e) =>
                  handleInputChange(q.id, "answer", e.target.value)
                }
                placeholder="正解"
                className={errors[`${q.id}-answer`] ? "error" : ""}
              />
              <input
                type="text"
                value={q.choices1} // 修正: `dummy1` → `choices1`
                onChange={(e) =>
                  handleInputChange(q.id, "choices1", e.target.value)
                }
                placeholder="ダミー1"
                className={errors[`${q.id}-choices1`] ? "error" : ""}
              />
              <input
                type="text"
                value={q.choices2} // 修正: `dummy2` → `choices2`
                onChange={(e) =>
                  handleInputChange(q.id, "choices2", e.target.value)
                }
                placeholder="ダミー2"
                className={errors[`${q.id}-choices2`] ? "error" : ""}
              />
            </div>
            {["answer", "choices1", "choices2"].map(
              (field) =>
                errors[`${q.id}-${field}`] && (
                  <span className="error-text" key={field}>
                    {errors[`${q.id}-${field}`]}
                  </span>
                )
            )}
          </div>
        ))}

        <button className="add-btn" onClick={addQuestion}>
          ＋
        </button>
        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={insertLoading}
        >
          {insertLoading ? "作成中..." : "作成"}
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
