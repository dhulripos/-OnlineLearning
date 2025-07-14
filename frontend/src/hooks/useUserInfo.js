import useAxios from "./useAxios";

export default function useUserInfo(action) {
  const axios = useAxios();

  switch (action) {
    case "get":
      return async () => getUserInfo(axios);
    case "edit":
      return async (data) => updateUserInfo(data, axios);
    default:
      throw new Error("Invalid action");
  }
}

async function getUserInfo(axios) {
  try {
    const res = await axios.get(`/GetUserInfo`);
    // console.log(res);
    return res.data;
  } catch (error) {
    // console.error("Error getting userInfo:", error);
    throw error;
  }
}

async function updateUserInfo({ name, era, occupationId }, axios) {
  try {
    era = Number(era);
    occupationId = Number(occupationId);
    const userInfo = { name: name, era: era, occupationId: occupationId };
    const res = await axios.post(`/EditUserInfo`, userInfo);

    return res;
  } catch (error) {
    // console.error("Error fetching genres:", error);
    throw error;
  }
}
