import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";
import { getDocs, collection, query, where,  } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../Context/AuthPreventContext";
import { type Todolist } from "../components/services";
import { useTodo } from "../Context/TodoProvider";

export default function Calendar() {
  const { user } = AuthContext();
  const navigate = useNavigate();
  const{todosCache,setTodosCache}=useTodo();
  //statefuntion
  const [currentDate, setCurrentDate] = useState(dayjs());


  
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

  const monthKey = currentDate.format("YYYY-MM");

  //animation
  const [direction, setDirection] = useState<"next" | "prev" | "">("");
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const transitionDuration = 300; // ระยะเวลาในการเลื่อน (ms)

  const displayedMonths = [
    currentDate.subtract(2, "month"),
    currentDate.subtract(1, "month"),
    currentDate,
    currentDate.add(1, "month"),
    currentDate.add(2, "month"),
  ];

  async function getTodolist() {
    try {
      if (!user?.uid) return;

      const startOfMonth = currentDate.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = currentDate.endOf("month").format("YYYY-MM-DD");

      const todosQuery = query(
        getTodosCol(user.uid),
        where("datekey", ">=", startOfMonth),
        where("datekey", "<=", endOfMonth),
      );
      const querySnapshot = await getDocs(todosQuery);
      const newdata = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todolist[];
      
      setTodosCache((prev) => ({
        ...prev,
        [monthKey]: newdata,
      }));
      console.log("Fetched todos:", newdata);
    } catch (error) {
      console.error("Error fetching todos:", error);
    }
  }
  //set next month
  function nextMonth() {
    if (isTransitioning) return; // ป้องกันการคลิกรัวๆ ระหว่างเลื่อน
    setDirection("next");
    setIsTransitioning(true);

    // รอให้ CSS เลื่อนเสร็จ (300ms) แล้วค่อยอัปเดตเดือนจริงในระบบ
    setTimeout(() => {
      setCurrentDate(currentDate.add(1, "month"));
      setDirection(""); // รีเซ็ตตำแหน่งแทร็กกลับมาตรงกลางแบบไร้รอยต่อ
      setIsTransitioning(false);
    }, transitionDuration);
  }

  //set prav month
  function prevMonth() {
    if (isTransitioning) return;
    setDirection("prev");
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentDate(currentDate.subtract(1, "month"));
      setDirection("");
      setIsTransitioning(false);
    }, transitionDuration);
  }

  function Selectedday(day: number) {
    const dateStr = currentDate.date(day).format("YYYY-MM-DD");
    // สั่งเปลี่ยนหน้าไปยัง Path ที่เราตั้งไว้ พร้อมแนบวันที่ไปด้วย
    navigate(`/to-do-list/${dateStr}`);
  }

  useEffect(() => {
    if (!user?.uid) return;
    if(todosCache[monthKey]){
      return
    }
    getTodolist();
    
    // setGetTodolist();
  }, [currentDate]);


  console.log("cache", todosCache);
  return (
    <>
      <section className="Caleder-page">
        <div className="month-slider-view">
          {/* ใส่คลาส transition-active เมื่ออยู่ในช่วงกำลังเลื่อนเท่านั้น */}
          <div
            className={`slider-track ${direction} ${isTransitioning ? "transition-active" : ""}`}
          >
            {displayedMonths.map((month, index) => {
              // ดัชนีที่ 2 คือเดือนปัจจุบัน (ตัวกลางจาก 5 ตัว)
              const isActive = index === 2;

              return (
                <button
                  key={month.format("YYYY-MM")}
                  className={`slider-item ${isActive ? "active" : "side"}`}
                  onClick={() => {
                    if (index < 2) prevMonth();
                    if (index > 2) nextMonth();
                  }}
                  disabled={isTransitioning}
                >
                  {month.format("MMMM")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="calendar">
          {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
          {emptyfirstDays.map((_, index) => (
            <div key={index} />
          ))}

          {days.map((day) => {
            const monthKey = currentDate.format("YYYY-MM");
            // ดึง List ของเดือนปัจจุบันออกมา ถ้ายังไม่มีให้เป็น Array ว่าง
            const currentMonthTodos = todosCache[monthKey] || [];
            return (
              <button
                key={day}
                onClick={() => Selectedday(day)}
                className="day-container"
              >
                <div
                  style={
                    isCurrentMonth && day === todayDate
                      ? { backgroundColor: "lightblue" }
                      : {}
                  }
                  className="day"
                >
                  {day}
                </div>
                <div className="todolist-content-container">
                  {Array.isArray(currentMonthTodos) &&
                    currentMonthTodos.filter(
                      (todo) =>
                        todo?.datekey ===
                        currentDate.date(day).format("YYYY-MM-DD"),
                    ).map((todo) => (
                      <div
                        key={todo?.id}
                        style={{ background: todo?.color ?? "#fff8f8" }}
                        className="todolist-content"
                      >
                        {todo?.name}
                      </div>
                    ))}
                </div>
              </button>
            );
          })}
          {emtyLastDays.map((_, index) => (
            <div key={index} />
          ))}
        </div>
      </section>
    </>
  );
}
