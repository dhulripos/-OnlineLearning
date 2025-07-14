import { Route, Routes, Navigate } from "react-router-dom";

// pages
import HomePage from "./pages/HomePage";
import Question from "./pages/Question";
import UserInfo from "./pages/UserInfo";
import PageNotFound from "./common/PageNotFound";

// components
import Callback from "./pages/auth/callback";
import GoogleLoginButton from "./components/GoogleLoginButton";
import Logout from "./components/Logout";
import CreateQuestion from "./components/CreateQuestion";
import QuestionList from "./components/QuestionList";
import FavoriteQuestion from "./components/FavoriteQuestion";
import EditUserInfo from "./components/EditUserInfo";
import QuestionDetails from "./components/QuestionDetails";
import Notification from "./components/Notification";
import MyQuestionList from "./components/MyQuestionList";
import AnswerQuestion from "./components/AnswerQuestion";
import SubmitResults from "./components/SubmitResults";
import FeatureIntro from "./components/FeatureIntro";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<GoogleLoginButton />} />
      <Route path="/auth/callback" element={<Callback />} />
      <Route path="/logout" element={<Logout />} />

      <Route path="/welcome" element={<HomePage />}>
        <Route path="" element={<FeatureIntro />} />
      </Route>

      {/* ユーザー情報絡み */}
      <Route path="/userinfo" element={<UserInfo />}>
        {/* ユーザー情報編集 */}
        <Route path="edit" element={<EditUserInfo />} />
      </Route>

      {/* 通知用API（未実装） */}
      <Route path="/notification" element={<Notification />} />

      {/* 問題集絡み */}
      <Route path="/question" element={<Question />}>
        {/* 問題作成 */}
        <Route path="create" element={<CreateQuestion />} />
        {/* 問題集検索 */}
        <Route path="search" element={<QuestionList />} />
        {/* お気に入り問題集一覧 */}
        <Route path="favorite" element={<FavoriteQuestion />} />
        {/* 問題集詳細 */}
        <Route path="set/:id" element={<QuestionDetails />} />
        {/* マイ学習リスト */}
        <Route path="my-question-list" element={<MyQuestionList />} />
        {/* 問題集回答 */}
        <Route path="answer/set/:id" element={<AnswerQuestion />} />
        {/* 回答結果 */}
        <Route path="submit/results/:id" element={<SubmitResults />} />
      </Route>

      {/* PageNotFound */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default App;
