import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useQuestion from "../hooks/useQuestion";
import "../css/SubmitResults.css";

export default function SubmitResults() {
  const { id } = useParams();

  // API 呼び出し用のカスタムフック
  const getSubmittedQuestions = useQuestion("getSubmittedQuestions"); // Redis から取得する回答済みデータ
  const getQuestionsByQuestionIds = useQuestion("getQuestionsByQuestionIds"); // DB から取得する問題データ

  // Redis から提出済みの回答結果を取得
  const { data: submitResults, isLoading: submitLoading } = useQuery({
    queryKey: ["submittedQuestions", id],
    queryFn: () => getSubmittedQuestions(id),
  });

  // submitResults の results 配列から questionId のリストを生成
  const questionIds =
    submitResults?.results?.map((result) => result.questionId) || [];

  // questionIds がある場合に、該当する問題データを取得
  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", questionIds],
    queryFn: () => getQuestionsByQuestionIds(questionIds),
    enabled: questionIds.length > 0,
  });

  // ローディング中はその旨を表示
  if (submitLoading || questionsLoading) {
    return <div>読み込み中...</div>;
  }

  // ユーザーの回答を簡単に参照するため、questionId をキーとしたマップを作成
  const resultMap = {};
  submitResults.results.forEach((result) => {
    resultMap[result.questionId] = result.userAnswer;
  });

  // console.log(questions);

  return (
    <div className="submit-results-container">
      {/* ヘッダー部分 */}
      <div className="submit-results-header">
        <h1>問題集回答結果</h1>
        <h4 style={{ textDecoration: "underline" }}>
          ※回答内容の閲覧は回答終了から24時間に制限されているため、ご注意ください。
        </h4>
      </div>

      {/* 問題集のタイトルとジャンル */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          gap: "20px",
          width: "100%",
          marginBottom: "30px",
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
          >
            {questions.questions[0]?.title}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={{ whiteSpace: "nowrap", marginBottom: "15px" }}>
            ジャンル：
          </label>
          <h1
            style={{
              flexGrow: 1,
              padding: "8px",
              width: "30%",
            }}
          >
            {questions?.questions[0]?.genreName}
          </h1>
        </div>
      </div>

      {/* 各問題の表示 */}
      <div className="submit-results-block-container">
        {questions?.questions?.map((q) => {
          // ユーザーがその問題で選択した回答を取得
          const userAnswer = resultMap[q.id];

          // 正解は q.answer、その他の選択肢は q.choices1, q.choices2 の固定順とする
          const choices = [q.answer, q.choices1, q.choices2];

          return (
            <div key={q.id} className="submit-results-block">
              <h2 className="submit-results-text">{q.question}</h2>
              <div className="submit-results-choices">
                {choices.map((choice, i) => {
                  const isUserSelected = choice === userAnswer;
                  const isCorrectChoice = choice === q.answer;
                  let labelClass = "submit-results-choice-label";
                  if (isUserSelected) {
                    // ユーザーが選択した選択肢の場合
                    labelClass += isCorrectChoice ? " correct" : " incorrect";
                  } else if (isCorrectChoice) {
                    // ユーザーが選択していなくても、正解の選択肢は強調する
                    labelClass += " correct-reveal";
                  }
                  return (
                    <label key={i} className={labelClass}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={choice}
                        checked={isUserSelected}
                        disabled={true}
                      />
                      <span>{choice}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
