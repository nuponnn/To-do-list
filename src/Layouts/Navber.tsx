import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { AuthContext } from "../Context/AuthPreventContext";
export default function Navber() {
  const dateStr = dayjs().format("YYYY-MM-DD");
  const { logout,user } = AuthContext();
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="/calendar">Calendar</Link>
      <Link to={`/to-do-list/${dateStr}`}>To do list</Link>

      <button onClick={logout} disabled={!user}>
        logout
      </button>
    </div>
  );
}
