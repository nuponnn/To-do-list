import { Outlet } from "react-router-dom";
import Navber from "./Navber";
import { Suspense } from "react";

export default function Mainlayout() {
  return (
    <div>
      <Navber />
      <Suspense fallback="กำลังโหลดหน้าใหม่...">
        <Outlet />
      </Suspense>
    </div>
  );
}
