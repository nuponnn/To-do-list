import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "../assets/css/Calendar.css";
import { AuthContext } from "../Context/AuthPreventContext";
import { services, type QuickTodo, type Todolist } from "../components/services";
import { useTodo } from "../Context/TodoProvider";
import ColorPicker from "../components/ColorPicker";
import { hasRealColor, resolveTextColor, type TagColor } from "../constants/color";
import Alertconfirm from "../components/Alertconfirm";

interface PendingStamp {
  dateKey: string; // เช่น "2026-07-26"
  name: string; // ชื่อ Todo
  value?: string; // ค่าของ Todo (ไม่บังคับ)
  color?: TagColor; // ไม่มี field = ไม่มีสี
  textColor?: TagColor;
}

const DAYS_WITH_COLORS = [
  { name: "sun", color: "day-sun" },
  { name: "mon", color: "day-mon" },
  { name: "tue", color: "day-tue" },
  { name: "wed", color: "day-wed" },
  { name: "thu", color: "day-thu" },
  { name: "fri", color: "day-fri" },
  { name: "sat", color: "day-sat" },
] as const;

export default function Calendar() {
  const { user } = AuthContext();
  const navigate = useNavigate();
  const { todosCache, setTodosCache } = useTodo();
  //Alert
  const [Alert, setAlert] = useState<{
    isOpen: boolean;
    action?: "Add" | "Edit" | "Delete";
    Item?: Partial<Todolist>;
    source?: "stamp" | "quick";
  }>({ isOpen: false });

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
    name:"",value:""
  });
  const [selectedQuickColor, setSelectedQuickColor] = useState<
    TagColor | undefined
  >(undefined);
  const [selectedQuickTextColor, setSelectedQuickTextColor] = useState<
    TagColor | undefined
  >(undefined);
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

  const resetCalendarComposer = () => {
    setNewQuickText({ name: "" ,value: ""});
    setSelectedQuickColor(undefined);
    setSelectedQuickTextColor(undefined);
    setActiveQuickId(null);
    setPendingStamps([]);
    setRedoHistory([]);
    setAlert({ isOpen: false });
  };

  const openQuickTodoConfirm = () => {
    setAlert({
      isOpen: true,
      source: "quick",
      Item: {
        id: newQuickText.id,
        name: newQuickText.name,
        value: newQuickText.value,
        color: selectedQuickColor,
        textColor: selectedQuickTextColor,
      },
      action: "Add",
    });
  };

  const openStampConfirm = () => {
    setAlert({
      isOpen: true,
      source: "stamp",
      Item: {},
      action: "Add",
    });
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
            setRedoHistory((r) => [...r, prev[existsIndex]]);
            return prev.filter((_, index) => index !== existsIndex);
          }

          setRedoHistory([]);
          return [
            ...prev,
            {
              dateKey: dateStr,
              name: targetQuick.name,
              value: targetQuick.value,
              color: targetQuick.color,
              textColor: targetQuick.textColor,
            },
          ];
        });
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
            textColor: item.textColor,
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
      setRedoHistory([]);
    } catch (error) {
      console.error("Error saving pending stamps:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleAddQuickTodo = async () => {
    if (!newQuickText.name?.trim() || !user?.uid) return;
    const newItemData: Omit<QuickTodo, "id"> = {
      name: newQuickText.name.trim(),
      value: newQuickText.value?.trim() || "",
      color: selectedQuickColor,
      textColor: selectedQuickTextColor,
    };
    try {
      // ยิงบันทึกลง Firestore
      const savedId = await services.addQuickTodo(user.uid, newItemData);

      // อัปเดต State หน้าจอทันที
      setQuickTodos((prev) => [...prev, { id: savedId, ...newItemData }]);
      setNewQuickText({ name: "" ,value:""});
      setSelectedQuickColor(undefined);
      setSelectedQuickTextColor(undefined);
    } catch (error) {
      console.error("Error adding quick todo:", error);
    }
  };

  const handleDeleteQuickTodo = async (id: string) => {
    if (!user?.uid) return;

    try {
      // ลบออกจาก Firestore
      await services.deleteQuickTodo(user.uid, id);

      // อัปเดต State ลบออกจากหน้าจอ
      setQuickTodos((prev) => prev.filter((item) => item.id !== id));
      if (activeQuickId === id) setActiveQuickId(null);
    } catch (error) {
      console.error("Error deleting quick todo:", error);
    }
  };

  function Isconfirm() {
    if (Alert.action === "Delete" && !Alert.Item?.id) {
      console.error("Missing id for", Alert.action);
      return;
    }
    switch (Alert.action) {
      case "Add":
        return Alert.source === "stamp"
          ? handleConfirmSave()
          : handleAddQuickTodo();

      case "Delete":
        return handleDeleteQuickTodo(Alert.Item?.id || "");
      default:
        return null;
    }
  }
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

    async function fetchQuickTodos() {
      try {
        if (!user?.uid) return;
        const data = await services.getQuickTodos(user.uid);
        if (data) {
          setQuickTodos(data);
        }
      } catch (error) {
        console.error("Error fetching quick todos:", error);
      }
    }

    fetchQuickTodos();
  }, [user?.uid]);

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

  // Memoize the calendar rendering to avoid unnecessary re-renders
  const calendar = useMemo(() => {
    return (
      <div className="calendar">
        {DAYS_WITH_COLORS.map(({ name, color }) => (
          <div key={name} className={`day-day ${color}`}>
            {name}
          </div>
        ))}
        {emptyfirstDays.map((_, index) => (
          <div key={`start-${index}`}  />
        ))}

        {days.map((day) => {
          const dayKey = currentDate.date(day).format("YYYY-MM-DD");
          // ดึง List ของเดือนปัจจุบันออกมา ถ้ายังไม่มีให้เป็น Array ว่าง
          const todosForDay = todosCache[monthKey]?.[dayKey] || [];
          const sortedTodosForDay = [...todosForDay].sort((a, b) => {
            // task ที่เสร็จแล้วดันลงท้ายเสมอ แล้วจึงให้ task ที่มีสีจริงอยู่บน
            const completePriority =
              Number(a.complete) - Number(b.complete);
            if (completePriority !== 0) return completePriority;
            return Number(hasRealColor(b.color)) - Number(hasRealColor(a.color));
          });
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
                className={`day ${isCurrentMonth && day === todayDate ? "is-today" : ""}`}
              >
                {day}
              </div>

              <div className="todolist-content-container">
                {sortedTodosForDay.map((todo) => (
                  <div
                    key={todo?.id}
                    style={{
                      background: todo?.color ?? "#fff8f8",
                      color: resolveTextColor(todo?.color, todo?.textColor),
                    }}
                    className={`todolist-content ${todo?.complete ? "is-done" : ""}`}
                  >
                    {todo?.name}
                  </div>
                ))}
              </div>
              {currentPendingForDay.map((pItem, idx) => (
                <div
                  key={`pending-${idx}`}
                  style={{
                    background: pItem.color ?? "#ffffff",
                    color: resolveTextColor(pItem.color, pItem.textColor),
                  }}
                  className="todolist-content pending-stamp"
                >
                  {pItem.name}
                </div>
              ))}
            </button>
          );
        })}
        {emtyLastDays.map((_, index) => (
          <div key={`end-${index}`}  />
        ))}
      </div>
    );
  }, [
   Selectedday,
  activeQuickId,
  currentDate,
  monthKey,
  pendingStamps,
  todosCache,
  ]);

  return (
    <>
      <section className="Caleder-page">
        {Alert.isOpen && (
          <Alertconfirm
            DataOpenAlert={Alert}
            SetOpenAlert={setAlert}
            Isconfirm={Isconfirm}
            pendingStampslength={pendingStamps.length}
            Page="Calendar"
          />
        )}

        <div className="cal-head">
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
        </div>
        {calendar}

        <div
          className={`button-todo-open ${todoopen ? "hidden" : "nohidden"}`}
          onClick={() => setTodoopen(true)}
        >
          open todo
        </div>

        <div className={`quick-todo-body ${todoopen ? "is-open" : ""}`}>
          {/* ปุ่ม Close */}
          <div
            className="button-todo-close "
            onClick={() => setTodoopen(false)}
          >
            close
          </div>
          <div className="quick-todo-inputs">
            <div>
              <h2 className="quick-todo-title">Create New Task</h2>
              <input
                type="text"
                placeholder="e.g., Homework"
                value={newQuickText.name}
                onChange={(e) =>
                  setNewQuickText({ ...newQuickText, name: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && openQuickTodoConfirm()}
                className="quick-input"
              />
              <div className="quick-field-label">Description</div>
              <input
                type="text"
                placeholder="e.g., Meeting"
                value={newQuickText.value}
                onChange={(e) =>
                  setNewQuickText({ ...newQuickText, value: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && openQuickTodoConfirm()}
                className="quick-input"
              />
            </div>
            <div className="color-picker-container">
              <ColorPicker
                value={selectedQuickColor}
                onChange={setSelectedQuickColor}
                textValue={selectedQuickTextColor}
                onTextChange={setSelectedQuickTextColor}
              />
              <button
                onClick={openQuickTodoConfirm}
                className="quick-add-btn"
                disabled={!!activeQuickId}
              >
                + Add
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
                    style={{
                      backgroundColor: item.color ?? "#ffffff",
                      color: resolveTextColor(item.color, item.textColor),
                    }}
                    onClick={() => setActiveQuickId(isActive ? null : item.id)}
                  >
                    <div>{item.name}</div>
                    {item.value && (
                      <span className="quick-tag-value">: {item.value}</span>
                    )}

                    <button
                      type="button"
                      className="quick-tag-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        setAlert({
                          isOpen: true,
                          Item: {
                            id: item.id,
                            name: item.name,
                            value: item.value,
                            color: item.color,
                            textColor: item.textColor,
                          },
                          action: "Delete",
                        });
                      }}
                      title="ลบรายการ"
                      disabled={!!activeQuickId}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="quick-todo-list quick-todo-empty">
              No quick todos available
            </div>
          )}
          {pendingStamps.length > 0 && (
            <div className="quick-pending-bar">
              <div className="quick-pending-info">
                <span>
                  เลือกไว้ทั้งหมด <strong>{pendingStamps.length}</strong>{" "}
                  รายการ:
                </span>
                <div className="quick-history">
                  <button
                    className="quick-history-btn"
                    onClick={handleUndo}
                    disabled={pendingStamps.length === 0}
                  >
                    Undo
                  </button>
                  <button
                    className="quick-history-btn"
                    onClick={handleRedo}
                    disabled={redoHistory.length === 0}
                  >
                    Redo
                  </button>
                </div>
              </div>
              <div className="quick-actions">
                <button className="btn-cancel" onClick={resetCalendarComposer}>
                  Cancel
                </button>

                <button
                  className="btn-confirm"
                  onClick={openStampConfirm}
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
