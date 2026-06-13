import { Link } from "react-router-dom"
import dayjs from "dayjs";
export default function Navber() {
const dateStr = dayjs().format("YYYY-MM-DD");
  
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="./calendar">Calendar</Link>
      <Link to={`./to-do-list/${dateStr}`}>To do list</Link>

    </div>
  )
}