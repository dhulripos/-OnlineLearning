import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useQuestion from "../hooks/useQuestion";
import { useQuery } from "@tanstack/react-query";
import "../css/MyQuestionList.css";
import { useRecoilState } from "recoil";
import { MyQuestionPageBackStorage } from "../recoils/pageBackRecoil";
import LoadingMotion from "../utils/LoadingMotion";
import { myQuestionSearchStorage } from "../recoils/questionRecoil";
import useGenre from "../hooks/useGenre";

export default function MyQuestionList() {
  const getMyQuestionList = useQuestion("getMyQuestionList");
  const getAllGenres = useGenre("all");

  const navigate = useNavigate();

  // Recoil
  const [page, setPage] = useRecoilState(MyQuestionPageBackStorage);
  const [myQuestionSearch, setMyQuestionSearch] = useRecoilState(
    myQuestionSearchStorage
  ); // 絞り込み条件を格納するRecoil

  // 検索条件のstate
  const [limit] = useState(10); // 1ページの表示件数
  // 絞り込み条件のstate
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("all");
  const [genreId, setGenreId] = useState(0);

  // 検索実行（ページネーション）
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions", { title, status, genreId, page, limit }],
    queryFn: () =>
      getMyQuestionList({
        title: myQuestionSearch?.title,
        status: myQuestionSearch?.status,
        genreId: myQuestionSearch?.genreId,
        page: page,
        limit: limit,
      }),
    enabled: true, // 初回実行
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

  return (
    <div className="container">
      {/* 検索エリア */}
      <div className="screen-title">
        <h2>マイ学習リスト</h2>

        <div className="search-filters">
          <div className="input-group wide">
            <label>問題集タイトル</label>
            <input
              type="text"
              placeholder="タイトルを入力"
              defaultValue={myQuestionSearch?.title}
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                setMyQuestionSearch((prev) => ({
                  ...prev,
                  title: newTitle,
                }));
                setPage(1);
              }}
            />
          </div>
          <div className="input-group">
            <label>ステータス</label>
            <select
              value={myQuestionSearch?.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                setMyQuestionSearch((prev) => ({
                  ...prev,
                  status: newStatus,
                }));
                setPage(1);
              }}
            >
              <option value="all">すべて</option>
              <option value="not_started">未着手</option>
              <option value="in_progress">進行中</option>
              <option value="completed">完了</option>
            </select>
          </div>
          <div className="input-group">
            <label>ジャンル</label>
            <select
              value={Number(myQuestionSearch?.genreId)}
              onChange={(e) => {
                const newGenreId = e.target.value;
                setGenreId(Number(e.target.value));
                setMyQuestionSearch((prev) => ({
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
              <th className="my-question-list-th total">総問題数</th>
              {/* <th className="my-question-list-th">正解数</th> */}
              <th className="my-question-list-th progress">進捗率</th>
              {/* <th className="my-question-list-th">予定進捗率</th> */}
              <th className="my-question-list-th deadline">期限</th>
              <th className="my-question-list-th status">ステータス</th>
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
                    <td className="my-question-list-td total-cell">
                      {question?.totalQuestions} 問
                    </td>
                    {/* <td className="my-question-list-td">
                      {question?.answeredCount} 問
                    </td> */}
                    <td className="my-question-list-td progress-cell">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${question?.progress}%` }}
                        ></div>
                        <span className="progress-bar-text">
                          {question?.progress}%
                        </span>
                      </div>
                    </td>

                    {/* <td className="my-question-list-td">
                      {question?.plannedProgress}
                    </td> */}
                    <td className="my-question-list-td deadline-cell">
                      {new Date(question?.deadline).toISOString().split("T")[0]}
                    </td>
                    <td className="my-question-list-td status-cell">
                      {{
                        not_started: "未着手",
                        in_progress: "進行中",
                        completed: "完了",
                      }[question?.status] || "不明"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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
