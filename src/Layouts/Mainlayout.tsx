import { Outlet } from "react-router-dom";
import Navber from "./Navber";
import { Suspense } from "react";
import {NetworkBanner} from "./NetworkBanner";

export default function Mainlayout() {
  return (
    <div className="app-shell">
      <Navber />
      <NetworkBanner/>
      <Suspense fallback="กำลังโหลดหน้าใหม่...">
        <Outlet />
      </Suspense>
    </div>
  );
}
