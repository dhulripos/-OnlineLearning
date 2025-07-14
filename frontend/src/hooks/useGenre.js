import useAxios from "./useAxios";

export default function useGenre(action) {
  const axios = useAxios();

  switch (action) {
    case "all":
      return async () => getAllGenres(axios);
    default:
      throw new Error("Invalid action");
  }
}

async function getAllGenres(axios) {
  try {
    const res = await axios.get(`/AllGenres`);
    return res;
  } catch (error) {
    // console.error("Error fetching genres:", error);
    throw error;
  }
}
