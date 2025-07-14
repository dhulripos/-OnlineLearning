import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useQuestion from "../hooks/useQuestion";
import { useQuery } from "@tanstack/react-query";
import "../css/MyQuestionList.css";
import { useRecoilState } from "recoil";
import { MyQuestionPageBackStorage } from "../recoils/pageBackRecoil";
import LoadingMotion from "../utils/LoadingMotion";

export default function MyQuestionList() {
  const getMyQuestionList = useQuestion("getMyQuestionList");

  // Recoil
  const [page, setPage] = useRecoilState(MyQuestionPageBackStorage);

  // 検索条件のstate
  const [limit] = useState(10); // 1ページの表示件数

  // 検索実行（ページネーション）
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions", { page, limit }],
    queryFn: () => getMyQuestionList({ page: page, limit: limit }),
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

  // console.log(page);
  // console.log(questions);

  // ページネーションの制御
  const totalCount = questions?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="container">
      {/* 検索エリア */}
      <div className="screen-title">
        <h2>マイ学習リスト</h2>
      </div>

      {/* 項目 */}
      <div className="content-box">
        <h3>検索結果</h3>
        <table className="my-question-list-table">
          <thead className="my-question-list-thead">
            <tr>
              <th className="my-question-list-th">問題集タイトル</th>
              <th className="my-question-list-th">ジャンル</th>
              <th className="my-question-list-th">総問題数</th>
              {/* <th className="my-question-list-th">正解数</th> */}
              <th className="my-question-list-th">進捗率</th>
              {/* <th className="my-question-list-th">予定進捗率</th> */}
              <th className="my-question-list-th">期限</th>
              <th className="my-question-list-th">ステータス</th>
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
                    <td
                      className="my-question-list-td"
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

                    <td className="my-question-list-td">
                      {question?.genreName}
                    </td>
                    <td className="my-question-list-td">
                      {question?.totalQuestions} 問
                    </td>
                    {/* <td className="my-question-list-td">
                      {question?.answeredCount} 問
                    </td> */}
                    <td className="my-question-list-td">
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
                    <td className="my-question-list-td">
                      {new Date(question?.deadline).toISOString().split("T")[0]}
                    </td>
                    <td className="my-question-list-td">
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
