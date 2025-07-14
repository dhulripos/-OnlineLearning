import useNotification from "../hooks/useNotification";

export default function Notification() {
  const {
    data: notifications,
    isLoading,
    error,
  } = useNotification("fetchNotifications");

  if (isLoading) return <div>Loading notifications...</div>;
  if (error) return <div>Error loading notifications</div>;

  return (
    <div className="notification-container">
      {notifications && notifications.length > 0 ? (
        notifications.map((n, index) => (
          <div key={index} className="notification">
            <p>{n.message}</p>
          </div>
        ))
      ) : (
        <p>No new notifications</p>
      )}
    </div>
  );
}
