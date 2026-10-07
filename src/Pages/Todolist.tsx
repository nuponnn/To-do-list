import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { AuthContext } from "../Context/AuthPreventContext";

import { useParams, useNavigate } from "react-router-dom";
import { services } from "../components/services";
import Alertconfirm from "../components/Alertconfirm";
import ColorPicker from "../components/ColorPicker";
import {
  hasRealColor,
  resolveTextColor,
  type TagColor,
} from "../constants/color";
import { useTodo } from "../Context/TodoProvider";
import dayjs from "dayjs";
import styles from "../assets/css/Todolist.module.css";
import { type Todolist } from "../components/services";

type ManageMode = "Add" | "Edit" | "Delete" | null;
type TodoAction = "Add" | "Edit" | "Delete";

const css = (...classNames: Array<string | false | null | undefined>) =>
  classNames
    .filter(Boolean)
    .map((className) => styles[className as string] || className)
    .join(" ");

let lastSeenDay: string | null = null;

export default function Todolist() {
  const { user, loading } = AuthContext();
  const { day } = useParams();
  const { setTodosCache, todosCache } = useTodo();
  const navigate = useNavigate();

  const [todolist, settodolist] = useState<Partial<Todolist>>({});
  // const [mydataTodolist, dispatch] = useReducer(todoReducer, []);
  const activeDay: string = day ?? dayjs().format("YYYY-MM-DD");

  const [Statusmode, SetStatusmode] = useState<ManageMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOldDataInput, setEditOldDataInput] = useState<Partial<Todolist>>({
    name: "",
    value: "",
  });
  const [selectedColor, setSelectedColor] = useState<TagColor | undefined>(
    undefined,
  );
  const [selectedTextColor, setSelectedTextColor] = useState<
    TagColor | undefined
  >(undefined);
  const [Alert, setAlert] = useState<{
    isOpen: boolean;
    action?: TodoAction;
    Item?: Partial<Todolist>;
  }>({ isOpen: false });

  const targetMonth = dayjs(activeDay).format("YYYY-MM");

  const year = dayjs(activeDay).format("YYYY");
  const month = dayjs(activeDay).format("MM");
  const monthKey = dayjs(activeDay).format("YYYY-MM");

  const sliderDates = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) =>
        dayjs(activeDay).add(offset, "day").format("YYYY-MM-DD"),
      ),
    [activeDay],
  );

  const dayTransitionMs = 300;
  const [trackDirection, setTrackDirection] = useState<"next" | "prev" | "">("");
  const [isDayTransitioning, setIsDayTransitioning] = useState(false);
  const listSwapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = listSwapRef.current;
    const prevDay = lastSeenDay;
    lastSeenDay = activeDay;
    if (!el || !prevDay || prevDay === activeDay) return;
    const forward = dayjs(activeDay).isAfter(prevDay, "day");
    el.classList.add(styles[forward ? "listSwapNext" : "listSwapPrev"]);
  }, [activeDay]);

  const resetTaskForm = () => {
    settodolist({});
    setEditOldDataInput({ name: "", value: "" });
    setSelectedColor(undefined);
    setSelectedTextColor(undefined);
    setEditingId(null);
  };

  const closeManageMode = () => {
    SetStatusmode(null);
    resetTaskForm();
  };

  const startAddMode = () => {
    resetTaskForm();
    SetStatusmode("Add");
  };

  const openTodoConfirm = (
    action: TodoAction,
    item: Partial<Todolist> = {},
  ) => {
    setAlert({
      isOpen: true,
      action,
      Item: item,
    });
  };

  //-----------------function updateDayCache ------------------

  function updateDayCache(
    month: string,
    dayKey: string,
    updater: (dayTodos: Todolist[]) => Todolist[],
  ) {
    setTodosCache((prev) => {
      const monthBucket = prev[month] || {};
      const dayTodos = monthBucket[dayKey] || [];
      return {
        ...prev,
        [month]: { ...monthBucket, [dayKey]: updater(dayTodos) },
      };
    });
  }

  const mydataTodolist = useMemo(
    () => todosCache[targetMonth]?.[activeDay] || [],
    [todosCache, targetMonth, activeDay],
  );

  // เหตุผล: แยกรายการที่มีสีจริงให้ขึ้นบนสุด เพื่อให้ task สำคัญเห็นก่อน แต่ยังคงเรียง task ที่ยังไม่เสร็จก่อน task ที่เสร็จเหมือนเดิม
  const sortedTodolist = useMemo(() => {
    return [...mydataTodolist].sort((a, b) => {
      const colorPriority =
        Number(hasRealColor(b.color)) - Number(hasRealColor(a.color));

      if (colorPriority !== 0) return colorPriority;

      return Number(a.complete) - Number(b.complete);
    });
  }, [mydataTodolist]);
  function Isconfirm() {
    if (
      (Alert.action === "Edit" || Alert.action === "Delete") &&
      !Alert.Item?.id
    ) {
      console.error("Missing id for", Alert.action);
      return;
    }
    switch (Alert.action) {
      case "Add":
        return addData();
      case "Edit":
        return saveEditData(Alert.Item?.id || "");
      case "Delete":
        return DeleteData(Alert.Item?.id || "");
      default:
        return null;
    }
  }

  //-----------------Add Data ------------------
  async function addData() {
    try {
      if (!user?.uid) return;
      if (!todolist.name?.trim()) {
        alert("กรุณากรอกข้อมูล");
        return;
      }

      const todoDataToSave: Omit<Todolist, "id"> = {
        name: todolist.name.trim(),
        value: todolist.value?.trim() || "",
        complete: false,
        createdAt: new Date(),
        datekey: activeDay,
        color: selectedColor,
        textColor: selectedTextColor,
      };

      const savedId = await services.addTodo(
        user.uid,
        year,
        month,
        todoDataToSave,
      );
      // dispatch({ type: "ADD_TODO", payload: newTodolist });
      const newTodoIntoCache: Todolist = {
        id: savedId,
        ...todoDataToSave,
      };
      updateDayCache(targetMonth, activeDay, (todo) => [
        ...todo,
        newTodoIntoCache,
      ]);
      alert("Add To Do Success");
      closeManageMode();
    } catch (error) {
      console.log(error);
    }
  }
  //-----------------Edit Data ------------------

  function handleStartEdit(todo: Todolist) {
    setEditingId(todo.id);
    setEditOldDataInput({
      name: todo.name,
      value: todo.value,
      color: todo.color,
      textColor: todo.textColor,
    });
    setSelectedColor(todo.color);
    setSelectedTextColor(todo.textColor);
    settodolist({});
  }

  async function saveEditData(id: string) {
    try {
      if (!user?.uid) return;

      const updates: Partial<Todolist> = {
        name: (todolist.name ?? editOldDataInput.name)?.trim(),
        value: (todolist.value ?? editOldDataInput.value)?.trim() || "",
        color: selectedColor,
        textColor: selectedTextColor,
      };

      if (!updates.name) {
        alert("กรุณากรอกข้อมูล");
        return;
      }

      await services.updateTodo(user.uid, year, month, id, updates);
      updateDayCache(targetMonth, activeDay, (todos) =>
        todos.map((t) => (t.id === id ? { ...t, ...updates, id } : t)),
      );
      alert("Edit To Do Success");
      resetTaskForm();
    } catch (error) {
      console.log(error);
    }
  }
  //-----------------checkbox Data ------------------

  async function toggleComplete(id: string, currentStats: boolean) {
    try {
      if (!user?.uid) return;
      await services.toggleComplete(user.uid, year, month, id, !currentStats);

      updateDayCache(targetMonth, activeDay, (todos) =>
        todos.map((t) =>
          t.id === id ? { ...t, complete: !currentStats, id } : t,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  }
  //-----------------checkbox Data ------------------

  // async function setTodoIcon(id: string, icon: string) {
  //   try {
  //     if (!user?.uid) return;
  //     await services.updateTodo(user.uid, id, { icon });

  //     updateDayCache(targetMonth, activeDay, (todos) =>
  //       todos.map((t) => (t.id === id ? { ...t, icon } : t)),
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  //-----------------Delete Data ------------------

  async function DeleteData(id: string) {
    try {
      if (!user?.uid) return;
      await services.deleteTodo(user.uid, year, month, id);

      updateDayCache(targetMonth, activeDay, (todos) =>
        todos.filter((t) => t.id !== id),
      );
      alert("Delete To Do Success");
      resetTaskForm();
    } catch (error) {
      console.log(error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    settodolist((prav) => ({ ...prav, [name]: value }));
  }
  //-----------------Next Day ------------------
  function goToDay(step: 1 | -1) {
    if (isDayTransitioning) return;
    const direction = step === 1 ? "next" : "prev";
    const targetDay = dayjs(activeDay).add(step, "day").format("YYYY-MM-DD");
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setTrackDirection(direction);
    setIsDayTransitioning(true);

    window.setTimeout(
      () => {
        navigate(`/to-do-list/${targetDay}`);
        setTrackDirection("");
        setIsDayTransitioning(false);
      },
      reduceMotion ? 0 : dayTransitionMs,
    );
  }

  function handleNextDay() {
    goToDay(1);
  }
  //-----------------Prev Day ------------------
  function handlePrevDay() {
    goToDay(-1);
  }
  //-----------------useEffect ------------------

  useEffect(() => {
    if (!user?.uid) return;

    //-----------------Get Data ------------------
    async function getData() {
      if (!user?.uid) return;
      if (todosCache[monthKey]) {
        return;
      }
      try {
        const data = await services.getTodos(user.uid, year, month);
        const groupedByDay: Record<string, Todolist[]> = {};
        if (!data) return;

        data.forEach((todo) => {
          if (!groupedByDay[todo.datekey]) groupedByDay[todo.datekey] = [];
          groupedByDay[todo.datekey].push(todo);
        });

        setTodosCache((prev) => ({
          ...prev,
          [targetMonth]: groupedByDay,
        }));
      } catch (error) {
        console.error("Failed to load todos:", error);
        alert("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
      }
    }
    getData();
  }, [setTodosCache, todosCache, user?.uid, monthKey, month, targetMonth, year]);

 // console.log("Todos Cache:", todosCache); // ตรวจสอบค่า todosCache ใน console
  
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading App...</div>
    );
  }

  return (
    <main className={css("page")}>
      {Alert.isOpen && (
        <Alertconfirm
          DataOpenAlert={Alert}
          SetOpenAlert={setAlert}
          Isconfirm={Isconfirm}
          OldData={editOldDataInput}
          Page="Todolist"
        />
      )}

      <section className={css("panel")}>
        <header className={css("header")}>
          <div className={css("titleBlock")}>
            <h1 className={css("title")}>To Do List</h1>
            <p className={css("meta")}>{user?.email}</p>
          </div>
          <div className={css("daycontrol")}>
            <div
              className={css("daySliderView")}
              role="group"
              aria-label="Change date"
            >
              <div
                className={css(
                  "sliderTrack",
                  isDayTransitioning && trackDirection === "next" && "dirNext",
                  isDayTransitioning && trackDirection === "prev" && "dirPrev",
                  isDayTransitioning && "transitionActive",
                )}
              >
                {sliderDates.map((dateStr, index) => {
                  if (index === 0 || index === 4) {
                    return (
                      <span
                        key={dateStr}
                        className={css("daySliderItem")}
                        aria-hidden="true"
                      >
                        {dateStr}
                      </span>
                    );
                  }
                  if (index === 2) {
                    return (
                      <span
                        key={dateStr}
                        className={css("daySliderItem", "active")}
                        aria-current="date"
                      >
                        {dateStr}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      className={css("daySliderItem", "daySliderBtn")}
                      onClick={index === 1 ? handlePrevDay : handleNextDay}
                      disabled={isDayTransitioning}
                    >
                      {dateStr}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {Statusmode === "Add" ? (
          <section className={css("addBox")}>
            <h2 className={css("formTitle")}>Create New Task</h2>
            <div className={css("fieldGrid")}>
              <label className={css("field")}>
                <span className={css("label")}>Task Title</span>
                <input
                  className={css("input")}
                  type="text"
                  name="name"
                  value={todolist.name || ""}
                  onChange={handleChange}
                  placeholder="e.g., Homework"
                />
              </label>
              <label className={css("field")}>
                <span className={css("label")}>Description</span>
                <input
                  className={css("input")}
                  type="text"
                  name="value"
                  value={todolist.value || ""}
                  onChange={handleChange}
                  placeholder="e.g., Page 15 to 20"
                />
              </label>
            </div>
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              textValue={selectedTextColor}
              onTextChange={setSelectedTextColor}
            />
            <div className={css("formActions")}>
              <button
                className={css("button", "primary")}
                onClick={() =>
                  openTodoConfirm("Add", {
                    name: todolist.name,
                    value: todolist.value,
                    color: selectedColor,
                    textColor: selectedTextColor,
                  })
                }
              >
                Save Task
              </button>
              <button
                className={css("button", "secondary")}
                onClick={closeManageMode}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : (
          <section className={css("toolTile")}>
            <div className={css("toolbar")}>
              {Statusmode === null ? (
                <>
                  <button
                    className={css("button", "primary")}
                    onClick={startAddMode}
                  >
                    Add Task
                  </button>
                  <button
                    className={css("button", "secondary")}
                    onClick={() => SetStatusmode("Edit")}
                  >
                    Edit Task
                  </button>
                  <button
                    className={css("button", "danger")}
                    onClick={() => SetStatusmode("Delete")}
                  >
                    Delete Task
                  </button>
                </>
              ) : (
                <button
                  className={css("button", "secondary")}
                  onClick={closeManageMode}
                >
                  Exit Manage Mode
                </button>
              )}
            </div>
          </section>
        )}

        <section className={css("listShell")}>
          <div key={activeDay} ref={listSwapRef}>
            <ul className={css("list")}>
              {sortedTodolist.map((todo) => (
                <li
                  key={todo.id}
                  className={css("item", todo.complete && "done")}
                  style={
                    { "--tag": todo.color ?? "transparent" } as CSSProperties
                  }
                >
                  <input
                    type="checkbox"
                    className={css("checkbox")}
                    checked={todo.complete}
                    onChange={() => toggleComplete(todo.id, todo.complete)}
                  />

                  {Statusmode === "Edit" &&
                  !todo.complete &&
                  editingId === todo.id ? (
                    <div className={css("editBox")}>
                      <div className={css("editFields")}>
                        <input
                          className={css("input")}
                          type="text"
                          name="name"
                          value={todolist.name ?? editOldDataInput.name ?? ""}
                          key={`edit-name-${editingId}`}
                          placeholder="Edit title"
                          onChange={handleChange}
                        />
                        <input
                          className={css("input")}
                          type="text"
                          name="value"
                          value={
                            todolist.value ?? editOldDataInput.value ?? ""
                          }
                          key={`edit-value-${editingId}`}
                          placeholder="Edit description"
                          onChange={handleChange}
                        />
                      </div>
                      <ColorPicker
                        key={todo.id}
                        value={selectedColor}
                        onChange={setSelectedColor}
                        textValue={selectedTextColor}
                        onTextChange={setSelectedTextColor}
                      />
                      <div className={css("itemActions")}>
                        <button
                          className={css("button", "success")}
                          onClick={() =>
                            openTodoConfirm("Edit", {
                              id: todo.id,
                              name: todolist.name,
                              value: todolist.value,
                              color: selectedColor,
                              textColor: selectedTextColor,
                            })
                          }
                        >
                          Save
                        </button>
                        <button
                          className={css("button", "secondary")}
                          onClick={closeManageMode}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={css("content")}>
                      <h3
                        className={css("itemTitle")}
                        style={{
                          color: resolveTextColor(todo.color, todo.textColor),
                        }}
                      >
                        {todo.name}
                      </h3>
                      <p className={css("itemText")}>{todo.value}</p>
                    </div>
                  )}

                  {Statusmode === "Edit" &&
                    !todo.complete &&
                    editingId !== todo.id && (
                      <div className={css("itemActions")}>
                        <button
                          className={css("button", "secondary")}
                          onClick={() => handleStartEdit(todo)}
                        >
                          Edit
                        </button>
                      </div>
                    )}

                  {Statusmode === "Delete" && (
                    <div className={css("itemActions")}>
                      <button
                        className={css("button", "danger")}
                        onClick={() => {
                          openTodoConfirm("Delete", {
                            id: todo.id,
                            name: todo.name,
                            value: todo.value,
                          });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {mydataTodolist.length === 0 && (
              <p className={css("empty")}>No tasks available for today</p>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
