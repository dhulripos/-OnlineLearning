import { Outlet } from "react-router-dom";
import Restricted from "../common/Restricted";
import NavigationBar from "../common/NavigationBar";

export default function Question() {
  return (
    <>
      <Restricted />
      <NavigationBar />
      <Outlet />
    </>
  );
}
