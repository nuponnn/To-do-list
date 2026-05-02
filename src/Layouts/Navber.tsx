import { Link } from "react-router-dom"

export default function Navber() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="./test">Test</Link>
      <Link to="./calendar">Calendar</Link>
      <Link to="./to-do-list">To do list</Link>

    </div>
  )
}