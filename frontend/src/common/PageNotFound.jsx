import { Link } from "react-router-dom";
import NavigationBar from "./NavigationBar";
import Restricted from "./Restricted";

export default function PageNotFound() {
  return (
    <div>
      <Restricted />
      <NavigationBar />
      <div className="container" style={{ marginTop: "250px" }}>
        <div className="d-flex justify-content-center">
          <p style={{ fontSize: "50px" }}>Not Found</p>
        </div>
        <div className="d-flex justify-content-center">
          <p>お探しのページは見つかりませんでした。</p>
        </div>
        <div className="d-flex justify-content-center">
          <Link
            className="btn-outline-dark rounded btn-lg"
            to="/welcome"
            style={{ marginTop: "80px", fontSize: "16px" }}
          >
            ホームページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
