import { Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { AuthContext } from "../Context/AuthPreventContext";

export default function Navbar() {
  const dateStr = dayjs().format("YYYY-MM-DD");
  const { logout, user } = AuthContext();
  const location = useLocation(); // ใช้เช็คว่าอยู่หน้าไหนเพื่อไฮไลท์สีเมนูได้

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* กลุ่มลิงก์เมนูฝั่งซ้าย */}
        <div className="nav-links">
          {/* <Link to="/" className={`nav-item ${location.pathname === "/" ? "active" : ""}`}>
            Home
          </Link> */}
          <Link to="/calendar" className={`nav-item ${location.pathname === "/calendar" ? "active" : ""}`}>
            Calendar
          </Link>
          <Link to={`/to-do-list/${dateStr}`} className={`nav-item ${location.pathname.startsWith("/to-do-list") ? "active" : ""}`}>
            To Do List
          </Link>
        </div>

        {/* กลุ่มโปรไฟล์/ปุ่มฝั่งขวา */}
        <div className="nav-actions">
          {user && <span className="user-email">{user.email}</span>}
          <button className="btn-logout" onClick={logout} disabled={!user}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}