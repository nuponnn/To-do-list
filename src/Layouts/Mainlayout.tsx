import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Suspense } from "react";
import {NetworkBanner} from "./NetworkBanner";


export default function Mainlayout() {
  const location = useLocation();  
  return (
    <div className="app-shell">
      <Navbar />
      <NetworkBanner/>
      <Suspense fallback="กำลังโหลดหน้าใหม่...">
        <Outlet key={location.pathname} />
      </Suspense>
    </div>
  );
}
