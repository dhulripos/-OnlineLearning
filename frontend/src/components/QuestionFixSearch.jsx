import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useQuestion from "../hooks/useQuestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import "../css/MyQuestionList.css";
import "../css/Modal.css";
import { useRecoilState } from "recoil";
import { MyCreatedQuestionPageBackStorage } from "../recoils/pageBackRecoil";
import LoadingMotion from "../utils/LoadingMotion";
import { myCreatedQuestionSearchStorage } from "../recoils/questionRecoil";
import useGenre from "../hooks/useGenre";

export default function MyQuestionList() {
  const getMyCreatedQuestionList = useQuestion("getMyCreatedQuestionList");
  const deleteQuestionSet = useQuestion("deleteQuestionSet");
  const getAllGenres = useGenre("all");

  // Recoil
  const [page, setPage] = useRecoilState(MyCreatedQuestionPageBackStorage);
  const [myCreatedQuestionSearch, setMyCreatedQuestionSearch] = useRecoilState(
    myCreatedQuestionSearchStorage
  ); // 絞り込み条件を格納するRecoil

  // 検索条件のstate
  const [limit] = useState(10); // 1ページの表示件数
  // 絞り込み条件のstate
  const [title, setTitle] = useState("");
  const [genreId, setGenreId] = useState(0);
  const [visibility, setVisibility] = useState("all");
  // 削除後のメッセージ
  const [successMessage, setSuccessMessage] = useState("");

  // モーダル用
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // 検索実行（ページネーション）
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions", { title, genreId, visibility, page, limit }],
    queryFn: () =>
      getMyCreatedQuestionList({
        title: myCreatedQuestionSearch?.title,
        visibility: myCreatedQuestionSearch?.visibility,
        genreId: myCreatedQuestionSearch?.genreId,
        page: page,
        limit: limit,
      }),
    enabled: false, // 初回実行を防ぐ
    retry: (failureCount, error) => {
      // 403 や 404 は即失敗、それ以外は2回だけ再試行
      if ([403, 404, 500, 401].includes(error?.response?.status)) return false;
      return failureCount < 2;
    },
  });

  // 初期表示用＆詳細から戻ってきたとき用
  useEffect(() => {
    refetch();
  }, []);
  // ページ変わったとき用
  useEffect(() => {
    refetch();
  }, [page]);

  // 検索ボタンが押された時の処理
  const handleSearch = () => {
    setPage(1); // 検索時にページをリセット
    refetch(); // 検索を実行
  };

  // ページネーションの制御
  const totalCount = questions?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // ジャンルを項目に表示するために取得
  const { data: genres, isLoading: genreIsLoading } = useQuery({
    queryKey: ["genres", {}],
    queryFn: () => getAllGenres(),
  });

  // 問題の更新用関数
  const { mutate: deleteMutate } = useMutation({
    mutationFn: (data) => deleteQuestionSet(data),
    onSuccess: (res) => {
      setSuccessMessage("削除が完了しました");

      // モーダルを閉じる
      setShowModal(false);
      setSelectedQuestion(null);

      // メッセージを5秒後に消す
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);

      // データを再取得（リロードより軽い）
      refetch();
    },
    onError: (error) => {
      console.error("更新エラー:", error);
    },
  });

  // 表示の制御
  const handleDelete = (questionSetId, title) => {
    const question = { id: questionSetId, title: title };
    setSelectedQuestion(question);
    setShowModal(true);
  };

  return (
    <div className="container">
      {/* 削除後のメッセージ */}
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {/* 検索エリア */}
      <div className="screen-title">
        <h2>問題集修正-検索</h2>

        <div className="search-filters">
          <div className="input-group wide">
            <label>問題集タイトル</label>
            <input
              type="text"
              placeholder="タイトルを入力"
              value={myCreatedQuestionSearch?.title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                setMyCreatedQuestionSearch((prev) => ({
                  ...prev,
                  title: newTitle,
                }));
                setPage(1);
              }}
            />
          </div>

          <div className="input-group">
            <label>公開範囲</label>
            <select
              className="visibility-select"
              value={myCreatedQuestionSearch?.visibility}
              onChange={(e) => {
                const newVisibility = e.target.value;
                console.log(newVisibility);
                setVisibility(e.target.value);
                setMyCreatedQuestionSearch((prev) => ({
                  ...prev,
                  visibility: newVisibility,
                }));
                setPage(1);
              }}
            >
              <option value="all">指定なし</option>
              <option value="private">プライベート</option>
              <option value="public">パブリック</option>
            </select>
          </div>

          <div className="input-group">
            <label>ジャンル</label>
            <select
              value={Number(myCreatedQuestionSearch?.genreId)}
              onChange={(e) => {
                const newGenreId = e.target.value;
                setGenreId(Number(e.target.value));
                setMyCreatedQuestionSearch((prev) => ({
                  ...prev,
                  genreId: Number(newGenreId),
                }));
                setPage(1);
              }}
            >
              {genreIsLoading ? (
                <option>Loading...</option>
              ) : (
                <>
                  <option value="0">すべて</option>
                  {genres?.data?.genres?.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <button
            className="search-button"
            onClick={handleSearch}
            disabled={isLoading}
          >
            検索
          </button>
        </div>
      </div>

      {/* 項目 */}
      <div className="content-box">
        <table className="my-question-list-table">
          <thead className="my-question-list-thead">
            <tr>
              <th className="my-question-list-th title">問題集タイトル</th>
              <th className="my-question-list-th genre">ジャンル</th>
              <th className="my-question-list-th genre">公開範囲</th>
              <th className="my-question-list-th genre">総問題数</th>
              <th className="my-question-list-th genre">作成日</th>
              <th className="my-question-list-th genre">更新日</th>
              <th className="my-question-list-th genre"></th>
            </tr>
          </thead>
          <tbody className="my-question-list-tbody">
            {isLoading ? (
              <tr>
                <td
                  className="my-question-list-td"
                  colSpan={8}
                  style={{ textAlign: "center" }}
                >
                  <LoadingMotion />
                </td>
              </tr>
            ) : (
              questions?.questions?.map((question) => {
                const questionSetId = question?.questionSetId;

                return (
                  <tr key={questionSetId}>
                    <td className="my-question-list-td title-cell">
                      <Link
                        to={`/question/set/${questionSetId}`}
                        style={{
                          display: "inline-block",
                          width: "100%",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {question?.title}
                      </Link>
                    </td>

                    <td className="my-question-list-td genre-cell">
                      {question?.genreName}
                    </td>
                    <td className="my-question-list-td genre-cell">
                      {question?.visibility === "public"
                        ? "パブリック"
                        : "プライベート"}
                    </td>
                    <td className="my-question-list-td genre-cell">
                      {question?.totalQuestions} 問
                    </td>
                    <td className="my-question-list-td genre-cell">
                      {question?.createdAt &&
                        new Date(question?.createdAt).toLocaleDateString(
                          "ja-JP"
                        )}
                    </td>
                    <td className="my-question-list-td genre-cell">
                      {question?.updatedAt &&
                        new Date(question?.updatedAt).toLocaleDateString(
                          "ja-JP"
                        )}
                    </td>
                    <td className="my-question-list-td">
                      <button
                        className="delete-set-btn"
                        onClick={() =>
                          handleDelete(questionSetId, question?.title)
                        }
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* モーダル */}
        {showModal && selectedQuestion && (
          <div className="modal-overlay">
            <div className="modal-content">
              <p>「{selectedQuestion?.title}」を削除しますか？</p>
              <div className="modal-buttons">
                <button
                  onClick={() => {
                    deleteMutate(selectedQuestion?.id);
                  }}
                >
                  はい
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedQuestion(null);
                  }}
                >
                  いいえ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalCount !== 0 && (
        <div className="my-question-list-pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            «
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={page === i + 1 ? "active" : ""}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
