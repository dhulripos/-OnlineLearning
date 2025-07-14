import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/FavoriteQuestion.css";
import useQuestion from "../hooks/useQuestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import useGenre from "../hooks/useGenre";
import { useRecoilState } from "recoil";
import { filterFavoriteQuestionStorage } from "../recoils/questionRecoil";
import LoadingMotion from "../utils/LoadingMotion";

export default function FavoriteQuestion() {
  const searchQuestions = useQuestion("search-favorite");
  const getAllGenres = useGenre("all");

  // Recoil
  const [questionSearch, setQuestionSearch] = useRecoilState(
    filterFavoriteQuestionStorage
  ); // 検索値を格納するRecoil

  // 検索条件のstate
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [genreId, setGenreId] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // 1ページの表示件数

  // 検索実行
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions", { title, visibility, genreId, page, limit }],
    queryFn: () =>
      searchQuestions({
        title: questionSearch?.title,
        visibility: questionSearch?.visibility,
        genreId: questionSearch?.genreId,
        page: page,
        limit: limit,
      }),
    enabled: true, // リロードしても即時検索処理が実行される
  });

  // console.log(questions);

  // 検索ボタンが押された時の処理
  const handleSearch = () => {
    setPage(1); // 検索時にページをリセット
    refetch(); // 検索を実行
  };

  // ページネーションの制御
  const totalCount = questions?.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // ジャンルを項目に表示するために取得
  const { data: genres, isLoading: genreIsLoading } = useQuery({
    queryKey: ["genres", {}],
    queryFn: () => getAllGenres(),
  });

  return (
    <div className="container">
      {/* 検索エリア */}
      <div className="search-box">
        <h2>お気に入り登録 問題集</h2>
        <div className="search-filters">
          <div className="input-group wide">
            <label>問題集タイトル</label>
            <input
              type="text"
              placeholder="タイトルを入力"
              defaultValue={questionSearch?.title}
              value={title}
              onChange={(e) => {
                const newTitle = e.target.value;
                setTitle(newTitle);
                setQuestionSearch((prev) => ({
                  ...prev,
                  title: newTitle,
                }));
              }}
            />
          </div>
          <div className="input-group">
            <label>公開範囲</label>
            <select
              value={questionSearch?.visibility}
              onChange={(e) => {
                const newVisibility = e.target.value;
                setVisibility(newVisibility);
                setQuestionSearch((prev) => ({
                  ...prev,
                  visibility: newVisibility,
                }));
              }}
            >
              <option value="public">パブリック</option>
              <option value="private">プライベート</option>
            </select>
          </div>
          <div className="input-group">
            <label>ジャンル</label>
            <select
              value={Number(questionSearch?.genreId)}
              onChange={(e) => {
                const newGenreId = e.target.value;
                setGenreId(Number(e.target.value));
                setQuestionSearch((prev) => ({
                  ...prev,
                  genreId: Number(newGenreId),
                }));
              }}
            >
              {genreIsLoading ? (
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
          <button className="search-button" onClick={handleSearch}>
            検索
          </button>
        </div>
      </div>

      {/* 検索結果 */}
      <div className="results-box">
        <h3>検索結果</h3>
        <table>
          <thead>
            <tr>
              <th>問題集タイトル</th>
              <th>ジャンル</th>
              <th>総評価</th>
              <th>平均評価</th>
              <th>作成者</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  <LoadingMotion />
                </td>
              </tr>
            ) : (
              questions?.data?.questions?.map((question) => {
                const questionSetId = question?.questionSetId;

                return (
                  <tr key={questionSetId}>
                    <td
                      style={{
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      <Link to={`/question/set/${questionSetId}`}>
                        {question?.title}
                      </Link>
                    </td>

                    <td>{question?.genreName}</td>
                    <td>{question?.totalStars}</td>
                    <td>{question?.avgStar}</td>
                    <td>{question?.userName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="pagination">
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
    </div>
  );
}
