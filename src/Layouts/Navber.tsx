import { Link } from "react-router-dom"

export default function Navber() {
  return (
    <div>
      <Link to="/">Home</Link>
      <Link to="./test">Test</Link>
    </div>
  )
}