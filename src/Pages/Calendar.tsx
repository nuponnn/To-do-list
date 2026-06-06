import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../Context/AuthPreventContext";
import { type Todolist } from "../components/services";

export default function Calendar() {
  const { user } = AuthContext();
  const navigate = useNavigate();
  //statefuntion
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [GetTodolist, setGetTodolist] = useState<Partial<Todolist[]>>();
  //set day in than month
  const daysInMonth: number = currentDate.daysInMonth();

  const getTodosCol = (uid: string) => collection(db, "UserData", uid, "todos");

  //set than the firestday is the date one ,what day is it on
  const firestDayOfMonth: number = currentDate.startOf("month").day();

  //set empty value from the beginning of the month
  const emptyfirstDays: Array<null> = Array(firestDayOfMonth).fill(null);
  //set empty value form the end of the month
  const emtyLastDays: Array<null> = Array(
    6 - currentDate.endOf("month").day(),
  ).fill(null);

  //set the day of the month as an array
  const days: Array<number> = Array.from(
    { length: daysInMonth },
    (_, i) => i + 1,
  );
  // set the current month is the month of today or not
  const isCurrentMonth = currentDate.isSame(dayjs(), "month");
  const todayDate = dayjs().date();

  //set the selected date is the date of today or not

  //set the month name
  const MonthName = currentDate.format("MMMM");

  async function getTodolist() {
    try{

      if (!user?.uid) return;
      const querySnapshot = await getDocs(getTodosCol(user.uid));
      const newdata = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todolist[];
      setGetTodolist(newdata);
    }catch(error){
      console.error("Error fetching todos:", error);
    }
  }
  //set next month
  function nextMonth() {
    const nextMonthDate = currentDate.add(1, "month");
    setCurrentDate(nextMonthDate);
  }

  //set prav month
  function prevMonth() {
    const prevMonthData = currentDate.subtract(1, "month");
    setCurrentDate(prevMonthData);
  }

  function Selectedday(day: number) {
    const dateStr = currentDate.date(day).format("YYYY-MM-DD");
    // สั่งเปลี่ยนหน้าไปยัง Path ที่เราตั้งไว้ พร้อมแนบวันที่ไปด้วย
    navigate(`/to-do-list/${dateStr}`);
  }

  useEffect(() => {
    if (!user?.uid) return;
    getTodolist();
    // setGetTodolist();
  }, []);
  console.log("todolist",GetTodolist);
  return (
    <>
      <section>
        <button
          onClick={() => {
            getTodolist();
            console.log(GetTodolist);
          }}
        >
          test
        </button>
        <button onClick={prevMonth}>pervtest</button>
        <button onClick={nextMonth}>nexttest</button>
        <div>{MonthName}</div>
        <div className="calendar">
          {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
          {emptyfirstDays.map((_, index) => (
            <div key={index} />
          ))}

          {days.map((day) => (
            <button key={day} onClick={() => Selectedday(day)}>
              <div
                style={
                  isCurrentMonth && day === todayDate
                    ? { backgroundColor: "lightblue" }
                    : {}
                }
              >
                {day}
              </div>
              <div>
                {Array.isArray(GetTodolist) &&
                  GetTodolist.filter(
                    (todo) =>
                      todo?.datekey ===
                      currentDate.date(day).format("YYYY-MM-DD"),
                  ).map((todo) => <div key={todo?.id}>
                    <div className="todolist-content">

                    {todo?.name}
                    </div>
                    </div>)}
              </div>
            </button>
          ))}
          {emtyLastDays.map((_, index) => (
            <div key={index} />
          ))}
        </div>
      </section>
    </>
  );
}
