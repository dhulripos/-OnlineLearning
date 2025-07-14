import { useState } from "react";

export default function BackButton() {
  const [isHovered, setIsHovered] = useState(false);

  const handleBack = () => {
    window.history.back();
  };

  const buttonStyle = {
    backgroundColor: isHovered ? "#696969" : "#808080",
    color: "white",
    padding: "12px 24px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "background-color 0.3s ease",
  };

  return (
    <button
      onClick={handleBack}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      前のページに戻る
    </button>
  );
}
