import { useEffect, useState } from "react";
import "../css/FixQuestion.css";
import useGenre from "../hooks/useGenre";
import useQuestion from "../hooks/useQuestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import BackButton from "./BackButton";
import LoadingMotion from "../utils/LoadingMotion";
import { useParams, useNavigate } from "react-router-dom";

export default function FixQuestion() {
  const getQuestionSetForFix = useQuestion("getQuestionSetForFix");
  const fixQuestions = useQuestion("fixQuestions");
  const { id } = useParams();
  const navigate = useNavigate();
  // 更新が成功したら、遷移元の画面に戻したい

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
  const [updateLoading, setUpdateLoading] = useState(false);

  // 問題集セットIDを元にデータを取得する
  const {
    data: questionSetData,
    error,
    isError,
  } = useQuery({
    queryKey: ["questions", { id }],
    queryFn: () => getQuestionSetForFix(id),
    retry: (failureCount, error) => {
      // 403 や 404 は即失敗、それ以外は2回だけ再試行
      if ([403, 404, 500, 401].includes(error?.response?.status)) return false;
      return failureCount < 2;
    },
  });
  // 問題集を修正しようとしているユーザーが作成者ではない場合
  useEffect(() => {
    if (
      isError &&
      (error?.status === 403 || error?.status === 401 || error?.status === 500)
    ) {
      alert("この問題集を修正する権限がありません。");
      window.history.back();
    }
  }, [error, isError]);

  // 更新用mutate
  const { mutate: updateMutate } = useMutation({
    mutationFn: (data) => fixQuestions(data),
    onSuccess: (res) => {
      if (res?.status === 200) {
        setUpdateLoading(false);
        navigate("/question/fix/search");
      }
    },
    onError: (error) => {
      setSuccessMessage("問題の更新に失敗しました");
      setTimeout(() => setSuccessMessage(""), 5000);
    },
  });

  useEffect(() => {
    if (questionSetData) {
      const loadedQuestions = questionSetData?.map((q) => ({
        id: q?.id,
        genreId: q?.genreId,
        visibility: q?.visibility,
        question: q?.question,
        answer: q?.answer,
        choices1: q?.choices1,
        choices2: q?.choices2,
      }));

      setQuestions(loadedQuestions);
      setTitle(questionSetData[0]?.title);
      setGenre(loadedQuestions[0]?.genreId ?? 1);
      setVisibility(loadedQuestions[0]?.visibility ?? "private");
    }
  }, [questionSetData]);

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
        isNew: true, // 新規追加であることを明示
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

  // 作成ボタン押下時の処理
  const handleUpdate = () => {
    if (!validate()) return;

    const data = {
      questionSetId: Number(id),
      title: title,
      genreId: genre,
      questions: questions.map(({ isNew, ...q }) => {
        if (isNew) {
          const { id, ...rest } = q; // 新規はidを除外して送る
          return rest;
        }
        return q; // 既存はid付きで送信
      }),
    };
    updateMutate(data);
    setUpdateLoading(true); // 送信中フラグをオンにする
  };

  const { data: genres, isLoading } = useQuery({
    queryKey: ["genres", {}],
    queryFn: () => getAllGenres(),
  });

  return (
    <div className="container">
      {/* 成功メッセージの表示 */}
      {successMessage && (
        <div className="success-message-fix">{successMessage}</div>
      )}
      {/* タイトルと公開範囲の選択 */}
      <div className="header">
        <h1>問題集修正</h1>
        <div className="select-group-fix">
          <label style={{ whiteSpace: "nowrap" }}>
            公開範囲とジャンルを選択：
          </label>
          <select
            className="visibility-select-fix"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            style={{ width: "200px" }}
          >
            <option value="private">プライベート</option>
            <option value="public">パブリック</option>
          </select>
          <select
            className="genre-select-fix"
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
      <div className="question-title-fix">
        <label style={{ whiteSpace: "nowrap" }}>問題集タイトル</label>
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

      <div className="form-container-fix">
        {questions.map((q) => (
          <div key={q.id} className="question-set-fix">
            {/* ×ボタン */}
            <button
              className="delete-btn-fix"
              onClick={() => removeQuestion(q.id)}
            >
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
            <div className="answer-group-fix">
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

        <button className="add-btn-fix" onClick={addQuestion}>
          ＋
        </button>
        <button
          className="fix-btn"
          onClick={handleUpdate}
          disabled={updateLoading}
        >
          {updateLoading ? <LoadingMotion /> : "作成"}
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
