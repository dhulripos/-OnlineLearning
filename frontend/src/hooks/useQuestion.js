import useAxios from "./useAxios";

export default function useQuestion(action) {
  const axios = useAxios();

  switch (action) {
    case "getMyQuestionList":
      return async (query) => {
        return getMyQuestionList(query, axios);
      };
    case "getQuestionSet":
      return async (questionSetId) => {
        return getQuestionSet(questionSetId, axios);
      };
    case "search":
      return async (searchQuery) => {
        return searchQuestions(searchQuery, axios);
      };
    case "search-favorite":
      return async (searchQuery) => {
        return searchFavoriteQuestions(searchQuery, axios);
      };
    case "insert":
      return async (data) => {
        return insertQuestion(data, axios);
      };
    case "register my_questions":
      return async (data) => {
        return registerMyQuestions(data, axios);
      };
    case "submit":
      return async (data) => {
        return submitQuestions(data, axios);
      };
    case "getSubmittedQuestions":
      return async (submittedId) => {
        return getSubmittedQuestions(submittedId, axios);
      };
    case "getQuestionsByQuestionIds":
      return async (ids) => {
        return getQuestionsByQuestionIds(ids, axios);
      };
    case "addToFavorite":
      return async (data) => {
        return addToFavorite(data, axios);
      };
    case "rating":
      return async (questionSetId) => {
        return rating(questionSetId, axios);
      };
    default:
      throw new Error("Invalid action");
  }
}

// マイ学習リストに追加している問題を評価する
async function rating({ questionSetId, rating }, axios) {
  try {
    const res = await axios.post(
      `/RatingQuestionSet?question_set_id=${questionSetId}&rating=${rating}`
    );
    return res;
  } catch (error) {
    // console.error("Error rating QuestionSet", error);
    throw error;
  }
}

// 問題集回答で回答を提出する
async function submitQuestions({ questionSetId, questions }, axios) {
  try {
    const res = await axios.post(
      `/SubmitQuestions?question_set_id=${questionSetId}`,
      questions
    );
    return res.data;
  } catch (error) {
    // console.error("Error submit questions", error);
    throw error;
  }
}

// 提出した回答を取得する
async function getSubmittedQuestions(submittedId, axios) {
  try {
    const res = await axios.get(
      `/GetSubmittedQuestions?submitted_id=${submittedId}`
    );
    return res.data;
  } catch (error) {
    // console.error("Error getting submittedQuestion.", error);
    throw error;
  }
}

async function getQuestionsByQuestionIds(ids, axios) {
  try {
    const idsStr = ids.join(","); // "66,67,68,69,70,71,72"
    const res = await axios.get("/GetQuestionsByQuestionIds", {
      params: { ids: idsStr },
    });
    return res.data;
  } catch (error) {
    // console.error("Error getting questions by questionIds", error);
    throw error;
  }
}

async function getMyQuestionList({ page, limit }, axios) {
  try {
    const res = await axios.get(
      `/GetMyQuestionList?page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error) {
    // console.log("Error getting MyQuestionList:", error);
    throw error;
  }
}

async function insertQuestion({ questions, title }, axios) {
  try {
    // console.log("Sending questions:", questions);
    // console.log("Sending title:", title);

    const res = await axios.post(`/InsertQuestion`, { title, questions });
    return res;
  } catch (error) {
    // console.error("Error inserting questions:", error);
    throw error;
  }
}

// 問題集詳細を取得
async function getQuestionSet(questionSetId, axios) {
  try {
    const res = await axios.get(
      `GetQuestionSet?question_set_id=${questionSetId}`
    );
    return res.data;
  } catch (error) {
    // console.log("Error getting QuestionSet", error);
    throw error;
  }
}

// 問題集検索において使用する
async function searchQuestions(searchQuery, axios) {
  try {
    // console.log("searchQuery", searchQuery);

    // AxiosのGETリクエストでは、リクエストボディを使用できないため、以下の記述はNG
    // const res = await axios.get(`/SearchQuestions`, searchQuery);

    // クエリパラメータとして送ることで送信できる
    const res = await axios.get(`/SearchQuestions`, { params: searchQuery });
    return res;
  } catch (error) {
    // console.error("Error searching questions:", error);
    throw error;
  }
}

// お気に入り問題集の検索において使用する
async function searchFavoriteQuestions(searchQuery, axios) {
  try {
    // console.log("searchQuery", searchQuery);

    // AxiosのGETリクエストでは、リクエストボディを使用できないため、以下の記述はNG
    // const res = await axios.get(`/SearchQuestions`, searchQuery);

    // クエリパラメータとして送ることで送信できる
    const res = await axios.get(`/SearchFavoriteQuestions`, {
      params: searchQuery,
    });
    return res;
  } catch (error) {
    // console.error("Error searching questions:", error);
    throw error;
  }
}

async function addToFavorite({ questionSetId, isFavorite }, axios) {
  try {
    const res = await axios.post(
      `/AddToFavorite?question_set_id=${questionSetId}&is_favorite=${isFavorite}`
    );
    return res;
  } catch (error) {
    // console.error("Error adding to favorite", error);
    throw error;
  }
}

async function registerMyQuestions({ questionSetId, deadline }, axios) {
  try {
    // console.log(questionSetId);
    const res = await axios.post(
      `/RegisterMyQuestions?question_set_id=${questionSetId}&deadline=${deadline}`
    );
    return res;
  } catch (error) {
    // console.error("Error registering my-questions", error);
    throw error;
  }
}
