import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";
import { AuthContext } from "../Context/AuthPreventContext";
import { services, type Todolist } from "../components/services";
import { useTodo } from "../Context/TodoProvider";

interface PendingStamp {
  dateKey: string; // เช่น "2026-07-26"
  name: string; // ชื่อ Todo
  value?: string; // ค่าของ Todo (ไม่บังคับ)
  color: string; // สี
}
interface QuickTodo {
  id: string; // ID ของ Quick Todo
  name: string; // ชื่อ Todo
  value?: string; // ค่าของ Todo (ไม่บังคับ)
  color: string; // สี
}
interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const defaultColors = [
    { name: "แดง", code: "#ff4d4d" },
    { name: "ฟ้า", code: "#4da6ff" },
    { name: "เขียว", code: "#5cd65c" },
    { name: "เหลือง", code: "#ffdb4d" },
  ];

  return (
    <div className="colorArea">
      <span className="colorLabel">สีแท็ก</span>
      <div className="colorRow">
        {defaultColors.map((c) => (
          <button
            key={c.code}
            type="button"
            aria-label={c.name}
            onClick={() => onColorChange(c.code)}
            className={`
              "colorDot" ${selectedColor === c.code && "colorDotActive"}
              `}
            style={{ backgroundColor: c.code }}
          />
        ))}
        <label className="customColor">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
          />
          custom
        </label>
      </div>
    </div>
  );
}

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

  //---------------------------todo list---------------------------
  const [newQuickText, setNewQuickText] = useState<Partial<QuickTodo>>({
    name: "",
    color: "#4da6ff",
  });
  const [selectedQuickColor, setSelectedQuickColor] = useState("#4da6ff");
  // เก็บ QuickTodo
  const [quickTodos, setQuickTodos] = useState<QuickTodo[]>([]);
  // สถานะของ QuickTodo ที่กำลัง active อยู่
  const [activeQuickId, setActiveQuickId] = useState<string | null>(null);
  // สถานะของ pending stamps
  const [pendingStamps, setPendingStamps] = useState<PendingStamp[]>([]); // สถานะของ pending stamps
  // 1. เพิ่ม State เก็บรายการที่ถูก Undo ออกไป เพื่อนำกลับมา Redo ได้
  const [redoHistory, setRedoHistory] = useState<PendingStamp[]>([]);

  const [todoopen, setTodoopen] = useState(false);

  const handleUndo = () => {
    if (pendingStamps.length === 0) return;
    const lastItem = pendingStamps[pendingStamps.length - 1];

    // ย้ายตัวล่าสุดจาก pendingStamps ไปเก็บไว้ใน redoHistory
    setRedoHistory((prev) => [...prev, lastItem]);
    setPendingStamps((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    const itemToRestore = redoHistory[redoHistory.length - 1];

    // นำตัวล่าสุดจาก redoHistory กลับเข้า pendingStamps
    setPendingStamps((prev) => [...prev, itemToRestore]);
    setRedoHistory((prev) => prev.slice(0, -1));
  };

  const Selectedday = useCallback(
    (day: number) => {
      const dateStr = currentDate.date(day).format("YYYY-MM-DD");

      if (activeQuickId) {
        const targetQuick = quickTodos.find((q) => q.id === activeQuickId);
        if (!targetQuick) return;
        setPendingStamps((prev) => {
          const existsIndex = prev.findIndex(
            (item) =>
              item.dateKey === dateStr && item.name === targetQuick.name,
          );
          if (existsIndex !== -1) {
         setRedoHistory((prev) => [...prev, {
              dateKey: dateStr,
              name: targetQuick.name,
              value: targetQuick.value,
              color: targetQuick.color,
            }]);
            return prev.filter((_, index) => index !== existsIndex);
          }
          
          return [
            ...prev,
            {
              dateKey: dateStr,
              name: targetQuick.name,
              value: targetQuick.value,
              color: targetQuick.color,
            },
          ];
        });
        setRedoHistory([]);
        return; // ไม่ต้อง navigate ไปหน้าอื่นเมื่อมี QuickTodo active
      }
      navigate("/to-do-list/" + dateStr);
    },
    [activeQuickId, currentDate, navigate, quickTodos],
  );



  const handleConfirmSave = async () => {
    if (pendingStamps.length === 0 || !user?.uid) return;
    try {
      await Promise.all(
        pendingStamps.map(async (item) => {
          const targetYear = dayjs(item.dateKey).format("YYYY");
          const targetMonth = dayjs(item.dateKey).format("MM");
          const targetMonthKey = dayjs(item.dateKey).format("YYYY-MM");

          //set data
          const todoDataToSave: Omit<Todolist, "id"> = {
            name: item.name,
            value: item.value,
            complete: false,
            createdAt: new Date(),
            datekey: item.dateKey,
            color: item.color,
          };
          const savedId = await services.addTodo(
            user.uid,
            targetYear,
            targetMonth,
            todoDataToSave,
          );
          setTodosCache((prev) => {
            const monthBucket = prev[targetMonthKey] || {};
            const dayTodos = monthBucket[item.dateKey] || [];
            return {
              ...prev,
              [targetMonthKey]: {
                ...monthBucket,
                [item.dateKey]: [
                  ...dayTodos,
                  { id: savedId, ...todoDataToSave },
                ],
              },
            };
          });
        }),
      );
      alert("บันทึกข้อมูลเรียบร้อยแล้ว!");

      // 3.3 ล้าง State ทั้งหมดเมื่อบันทึกสำเร็จ
      setPendingStamps([]);
      setActiveQuickId(null);
    } catch (error) {
      console.error("Error saving pending stamps:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleAddQuickTodo = () => {
    if (!newQuickText.name?.trim()) return;
    const newItem: QuickTodo = {
      id: Date.now().toString(),
      name: newQuickText.name.trim(),
      value: newQuickText.value?.trim() || "",
      color: selectedQuickColor,
    };
    setQuickTodos((prev) => [...prev, newItem]);
    setNewQuickText({ name: "", value: "", color: "#4da6ff" });
  };

  const handleDeleteQuickTodo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // ป้องกันการคลิกโดนเพื่อเลือก Tag
    setQuickTodos((prev) => prev.filter((item) => item.id !== id));
    if (activeQuickId === id) setActiveQuickId(null);
  };

  // console.log(activeQuickId, "activeQuickId");
  // console.log(newQuickText, "newQuickText");
  console.log("hisrery", redoHistory);
  //---------------------------end todo list---------------------------

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
            (a, b) =>
              Number(hasTodoColor(b.color)) - Number(hasTodoColor(a.color)),
          );
          const currentPendingForDay = pendingStamps.filter(
            (item) => item.dateKey === dayKey,
          );
          return (
            <button
              key={day}
              onClick={() => Selectedday(day)}
              className={`day-container ${activeQuickId ? "quick-stamp-mode" : ""}`}
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
              {currentPendingForDay.map((pItem, idx) => (
                <div
                  key={`pending-${idx}`}
                  style={{
                    background: pItem.color,
                    opacity: 0.6, // ทำให้จางลงเล็กน้อย
                    border: "1px dashed #000", // ใส่เส้นประ
                  }}
                  className="todolist-content"
                >
                  ⏳ {pItem.name}
                </div>
              ))}
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

        {todoopen ? (
          <div className="quick-todo-body">
            {/* ช่องกรอกข้อมูล + ปุ่มเพิ่ม */}
            <div className="quick-todo-inputs">
              <div>
                <h2>Create New Task</h2>
                <input
                  type="text"
                  placeholder="e.g., Homework"
                  value={newQuickText.name}
                  onChange={(e) =>
                    setNewQuickText({ ...newQuickText, name: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddQuickTodo()}
                  className="quick-input"
                />
                <span>Description</span>
                <input
                  type="text"
                  placeholder="e.g., Meeting"
                  value={newQuickText.value}
                  onChange={(e) =>
                    setNewQuickText({ ...newQuickText, value: e.target.value })
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddQuickTodo()}
                  className="quick-input"
                />
              </div>
              <div className="color-picker-container">
                <ColorPicker
                  selectedColor={selectedQuickColor}
                  onColorChange={setSelectedQuickColor}
                />
                <button onClick={handleAddQuickTodo} className="quick-add-btn">
                  + เพิ่ม
                </button>
              </div>
            </div>

            {quickTodos.length > 0 ? (
              <div className="quick-todo-list">
                {quickTodos.map((item) => {
                  const isActive = activeQuickId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`quick-tag ${isActive ? "active" : ""}`}
                      style={{ backgroundColor: item.color }}
                      onClick={() =>
                        setActiveQuickId(isActive ? null : item.id)
                      }
                    >
                      <div>{item.name}</div>
                      {item.value && (
                        <span className="quick-tag-value">: {item.value}</span>
                      )}

                      <button
                        className="quick-tag-delete"
                        onClick={(e) => handleDeleteQuickTodo(e, item.id)}
                        title="ลบรายการ"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="quick-todo-list">No quick todos available</div>
            )}
            {pendingStamps.length > 0 && (
              <div className="quick-pending-bar">
                <span>
                  เลือกไว้ทั้งหมด <strong>{pendingStamps.length}</strong>{" "}
                  รายการ: 
                  <div>
                    {/* 🟢 แก้ไข: ปุ่ม Undo (ย้อนกลับ) */}
                  <button
                    className="prev-item"
                    onClick={handleUndo}
                    disabled={pendingStamps.length === 0}
                  >
                    Undo
                  </button>
                  {/* 🟢 แก้ไข: ปุ่ม Redo (ทำซ้ำ/ยกเลิกย้อนกลับ) */}
                  <button
                    className="prev-item"
                    onClick={handleRedo}
                    disabled={redoHistory.length === 0}
                  >
                    Redo
                  </button>
                  </div>
                </span>
                <div className="quick-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setPendingStamps([])}
                  >
                    Cancel
                  </button>
                  <button className="btn-confirm" onClick={handleConfirmSave}>
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="button-todo-open" onClick={() => setTodoopen(true)}>
            open
          </div>
        )}
      </section>
    </>
  );
}
