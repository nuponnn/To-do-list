import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";
import { AuthContext } from "../Context/AuthPreventContext";
import { services, type Todolist } from "../components/services";
import { useTodo } from "../Context/TodoProvider";

export default function Calendar() {
  const { user } = AuthContext();
  const navigate = useNavigate();
  const { todosCache, setTodosCache } = useTodo();
  //statefuntion
  const [currentDate, setCurrentDate] = useState(dayjs());

  //set day in than month
  const daysInMonth: number = currentDate.daysInMonth();

  // const getTodosCol = (uid: string) => collection(db, "UserData", uid, "todos");

  const year = dayjs(currentDate).format("YYYY");
    const month = dayjs(currentDate).format("MM");

  //set than the firestday is the date one ,what day is it on
  const firestDayOfMonth: number = currentDate.startOf("month").day();

  //set empty value from the beginning of the month
  const emptyfirstDays: Array<null> = Array(firestDayOfMonth).fill(null);
  // ล็อกปฏิทินให้มี 6 แถวเสมอ เพื่อไม่ให้เดือนที่มี 5/6 แถวดันตำแหน่งปีและแถบเดือนต่างกัน
  const totalCalendarCells = 42;
  const emtyLastDays: Array<null> = Array(
    Math.max(0, totalCalendarCells - emptyfirstDays.length - daysInMonth),
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

  const Selectedday = useCallback((day: number) => {
    const dateStr = currentDate.date(day).format("YYYY-MM-DD");
    // สั่งเปลี่ยนหน้าไปยัง Path ที่เราตั้งไว้ พร้อมแนบวันที่ไปด้วย
    navigate("/to-do-list/" + dateStr);
  }, [currentDate, navigate]);

  useEffect(() => {
    if (!user?.uid) return;
    if (todosCache[monthKey]) {
      return;
    }
    async function getTodolist() {
      try {
        if (!user?.uid) return;


        const data = await services.getTodos(user.uid, year, month);

        const groupedByDay: Record<string, Todolist[]> = {};
        if (!data) return;
        data.forEach((todo) => {
          if (!groupedByDay[todo.datekey]) groupedByDay[todo.datekey] = [];
          groupedByDay[todo.datekey].push(todo);
        });

        setTodosCache((prev) => ({
          ...prev,
          [monthKey]: groupedByDay,
        }));
        // console.log("Fetched todos:", groupedByDay);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    }
    getTodolist();

    // setGetTodolist();
  }, [user?.uid, monthKey, month, setTodosCache, todosCache, year]);

  const calendar = useMemo(() => {
    // เหตุผล: ใช้เฉพาะตอนแสดงผลใน Calendar เพื่อดัน todo ที่มีสีจริงขึ้นบนสุด โดยไม่เปลี่ยนลำดับข้อมูลต้นฉบับใน cache
    const hasTodoColor = (color?: string) => {
      const normalizedColor = color?.trim().toLowerCase();
      return Boolean(normalizedColor && normalizedColor !== "#ffffff");
    };

    return (
      <div className="calendar">

        {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
        {emptyfirstDays.map((_, index) => (
          <div key={index} />
        ))}

        {days.map((day) => {
          const dayKey = currentDate.date(day).format("YYYY-MM-DD");
          // ดึง List ของเดือนปัจจุบันออกมา ถ้ายังไม่มีให้เป็น Array ว่าง
          const todosForDay = todosCache[monthKey]?.[dayKey] || [];
          const sortedTodosForDay = [...todosForDay].sort(
            (a, b) => Number(hasTodoColor(b.color)) - Number(hasTodoColor(a.color)),
          );
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
                {sortedTodosForDay.map((todo) => (
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
    );
  }, [
    Selectedday,
    currentDate,
    days,
    emptyfirstDays,
    emtyLastDays,
    isCurrentMonth,
    monthKey,
    todayDate,
    todosCache,
  ]);
  return (
    <>
      <section className="Caleder-page">
         <div className="year">{year}</div>
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
        {calendar}
      </section>
    </>
  );
}
