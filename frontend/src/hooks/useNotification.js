import useAxios from "./useAxios";

export default function useNotification(action) {
  const axios = useAxios();

  switch (action) {
    case "fetchNotifications":
      return async () => {
        return fetchNotifications(axios);
      };
    default:
      throw new Error("Invalid action");
  }
}

async function fetchNotifications(axios) {
  const res = await axios.get("/api/notifications");
  return res.data;
}
