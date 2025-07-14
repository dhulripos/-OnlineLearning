import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../css/QuestionList.css";
import useQuestion from "../hooks/useQuestion";
import { useQuery, useMutation } from "@tanstack/react-query";
import useGenre from "../hooks/useGenre";
import { useRecoilState } from "recoil";
import { questionSearchStorage } from "../recoils/questionRecoil";
import { QuestionSearchPageBackStorage } from "../recoils/pageBackRecoil";
import LoadingMotion from "../utils/LoadingMotion";

export default function QuestionList() {
  const searchQuestions = useQuestion("search");
  const getAllGenres = useGenre("all");
  const addToFavorite = useQuestion("addToFavorite");

  // Recoil
  const [questionSearch, setQuestionSearch] = useRecoilState(
    questionSearchStorage
  ); // 検索値を格納するRecoil
  const [page, setPage] = useRecoilState(QuestionSearchPageBackStorage);

  // 検索条件のstate
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [genreId, setGenreId] = useState(1);
  // const [page, setPage] = useState(pageBackRecoil?.page || 1);
  const [limit] = useState(10); // 1ページの表示件数

  // お気に入り状態を管理
  const [favoriteStates, setFavoriteStates] = useState({});
  const [poppingStates, setPoppingStates] = useState({});
  const [confettiStates, setConfettiStates] = useState({});
  const [pendingUpdates, setPendingUpdates] = useState([]); // 更新待ちのキュー

  // お気に入り更新関数
  const { mutate: addMutate } = useMutation({
    mutationFn: (data) => addToFavorite(data),
    onSuccess: (res) => {
      // console.log("お気に入り追加成功:", res);
    },
    onError: (error) => {
      // console.error("更新エラー:", error);
    },
  });

  // お気に入りボタン押下時のハンドラー
  const toggleFavorite = (questionSetId) => {
    const isFavorite = !!favoriteStates[questionSetId];

    setFavoriteStates((prev) => ({
      ...prev,
      [questionSetId]: !isFavorite, // トグル（ON/OFF切り替え）
    }));

    // 更新キューに追加
    setPendingUpdates((prev) => [...prev, questionSetId]);

    if (!isFavorite) {
      // お気に入り登録時のみクラッカー演出
      setPoppingStates((prev) => ({ ...prev, [questionSetId]: true }));
      setConfettiStates((prev) => ({
        ...prev,
        [questionSetId]: [...Array(12).keys()], // 12個の紙吹雪
      }));

      setTimeout(() => {
        setPoppingStates((prev) => ({ ...prev, [questionSetId]: false }));
        setConfettiStates((prev) => ({ ...prev, [questionSetId]: [] }));
      }, 800);
    }
  };

  // `pendingUpdates` の変更を監視し、最新の `favoriteStates` を使って `addMutate` を実行
  useEffect(() => {
    if (pendingUpdates.length === 0) return;

    setPendingUpdates((prev) => {
      const updatesToProcess = [...prev]; // 処理中のアップデート
      updatesToProcess.forEach((questionSetId) => {
        addMutate({ questionSetId, isFavorite: favoriteStates[questionSetId] });
      });

      return []; // キューをクリア
    });
  }, [pendingUpdates, favoriteStates]);

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
    enabled: false, // 初回実行を防ぐ
  });

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

  // 検索後に表示されるお気に入りボタンの制御
  useEffect(() => {
    if (questions?.data?.questions) {
      const newFavoriteStates = questions.data.questions.reduce(
        (acc, question) => {
          acc[question.questionSetId] = question.isFavorite;
          return acc;
        },
        {}
      );

      setFavoriteStates(newFavoriteStates);
    }
  }, [questions]);

  // useEffect(() => {
  //   if (questionSearch) {
  //     setTitle(questionSearch.title || "");
  //     setVisibility(questionSearch.visibility || "public");
  //     setGenreId(questionSearch.genreId || 1);
  //   }
  // }, [questionSearch]);

  // 詳細から戻ってきたとき用
  useEffect(() => {
    refetch();
  }, []);
  // ページが変わった時に再検索する
  useEffect(() => {
    refetch();
  }, [page]);

  // ★1つ分のコンポーネント（SVGを使用して★を描画）
  const Star = ({ fill = "0%", uniqueId }) => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <defs>
        <linearGradient id={`starGrad-${uniqueId}`}>
          <stop offset="0%" stopColor="#ffc107" />
          <stop offset={fill} stopColor="#ffc107" />
          <stop offset={fill} stopColor="#e4e5e9" />
          <stop offset="100%" stopColor="#e4e5e9" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#starGrad-${uniqueId})`}
        d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.881 
           1.44 8.303L12 18.896l-7.376 3.994 1.44-8.303-6.064-5.881 
           8.332-1.151z"
      />
    </svg>
  );

  // 評価を★で表示するコンポーネント
  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const fraction = rating - fullStars;
    const hasFraction = fraction > 0;
    const emptyStars = 5 - fullStars - (hasFraction ? 1 : 0);
    const fractionFill = `${Math.round(fraction * 100)}%`;

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {Array.from({ length: fullStars }, (_, i) => (
          <Star key={`full-${i}`} fill="100%" uniqueId={`full-${i}`} />
        ))}
        {hasFraction && (
          <Star
            key={`fraction-${fractionFill}`}
            fill={fractionFill}
            uniqueId={`fraction-${fractionFill}`}
          />
        )}
        {Array.from({ length: emptyStars }, (_, i) => (
          <Star key={`empty-${i}`} fill="0%" uniqueId={`empty-${i}`} />
        ))}
      </div>
    );
  };

  return (
    <div className="container">
      {/* 検索エリア */}
      <div className="search-box">
        <h2>問題集検索</h2>
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
                const isFavorite = !!favoriteStates[questionSetId]; // お気に入り状態

                return (
                  <tr key={questionSetId}>
                    <td>
                      <Link to={`/question/set/${questionSetId}`}>
                        {question?.title}
                      </Link>

                      {/* 以下、お気に入りボタンの実装が問題集評価と被るためコメントアウト */}
                      {/* 別の機能として使えるかもしれないので、残しておく */}
                      {/* <button
                        onClick={() => toggleFavorite(questionSetId)}
                        className="star-button"
                      >
                        {isFavorite ? "★" : "☆"}
                      </button> */}
                      {/* 紙吹雪 */}
                      {/* <div className="confetti-container">
                        {confettiStates[questionSetId]?.map((_, idx) => (
                          <span
                            key={idx}
                            className="confetti"
                            style={{
                              backgroundColor: [
                                "#ff4081",
                                "#ffeb3b",
                                "#4caf50",
                                "#2196f3",
                                "#ff5722",
                              ][idx % 5],
                              left: `${Math.random() * 30 - 15}px`,
                              top: `${Math.random() * -30 - 50}px`,
                              transform: `rotate(${Math.random() * 360}deg)`,
                              animation: "confetti-fall 0.8s ease-out forwards",
                            }}
                          />
                        ))}
                      </div> */}
                    </td>

                    <td>{question?.genreName}</td>
                    <td>{question?.totalStars}</td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {/* 数字部分に固定幅を設定して、全行で★表示位置を揃える */}
                        <span
                          style={{
                            display: "inline-block",
                            width: "40px",
                            textAlign: "right",
                          }}
                        >
                          {Math.floor((question?.avgStar || 0) * 10) / 10}
                        </span>
                        <span style={{ marginLeft: "8px" }}>
                          <StarRating rating={question?.avgStar || 0} />
                        </span>
                      </div>
                    </td>

                    <td>{question?.userName}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {totalCount !== 0 && (
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
      )}

      {/* お気に入りボタンのCSS */}
      <style>
        {`
          /* 星ボタンのデザイン */
          .star-button {
            font-size: 20px;
            color: #ffd700;
            border: none;
            background: none;
            cursor: pointer;
            margin-left: 10px;
            transition: transform 0.2s ease-out;
          }

          .star-button:active {
            transform: scale(1.2);
          }

          /* クラッカーの紙吹雪エフェクト */
          .confetti-container {
            position: absolute;
            top: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 50px;
            pointer-events: none;
          }

          .confetti {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            opacity: 1;
          }

          /* 紙吹雪が上に舞って消えるアニメーション */
          @keyframes confetti-fall {
            0% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translateY(-50px) scale(0.5);
            }
          }
        `}
      </style>
    </div>
  );
}
