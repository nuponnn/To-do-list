import { useState, useEffect, useMemo } from "react";
import { AuthContext } from "../Context/AuthPreventContext";

import { useParams, useNavigate } from "react-router-dom";
import { services } from "../components/services";
import Alertconfirm from "../components/Alertconfirm";
import { useTodo } from "../Context/TodoProvider";
import dayjs from "dayjs";
import styles from "../assets/css/Todolist.module.css";
import { type Todolist } from "../components/services";

const css = (...classNames: Array<string | false | null | undefined>) =>
  classNames
    .filter(Boolean)
    .map((className) => styles[className as string] || className)
    .join(" ");

// interface Todolist {
//   id: string;
//   name: string;
//   value?: string;
//   complete: boolean;
//   createdAt: Date;
//   datekey: string;
//   color?: string;
//   icon?: string;
// }
// type Action =
//   | { type: "SET_TODOS"; payload: Todolist[] }
//   | { type: "ADD_TODO"; payload: Todolist }
//   | { type: "UPDATE_TODO"; payload: { id: string; updates: Partial<Todolist> } }
//   | { type: "DELETE_TODO"; payload: string };

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
    <div className={css("colorArea")}>
      <span className={css("colorLabel")}>สีแท็ก</span>
      <div className={css("colorRow")}>
        {defaultColors.map((c) => (
          <button
            key={c.code}
            type="button"
            aria-label={c.name}
            onClick={() => onColorChange(c.code)}
            className={css(
              "colorDot",
              selectedColor === c.code && "colorDotActive",
            )}
            style={{ backgroundColor: c.code }}
          />
        ))}
        <label className={css("customColor")}>
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

export default function Todolist() {
  const { user, loading } = AuthContext();
  const { day } = useParams();
  const { setTodosCache, todosCache } = useTodo();
  const navigate = useNavigate();

  const [todolist, settodolist] = useState<Partial<Todolist>>({});
  // const [mydataTodolist, dispatch] = useReducer(todoReducer, []);
  const activeDay: string = day ?? new Date().toISOString().split("T")[0];

  const [Statusmode, SetStatusmode] = useState<
    "Add" | "Edit" | "Delete" | null
  >(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOldDataInput, setEditOldDataInput] = useState<Partial<Todolist>>({
    name: "",
    value: "",
  });
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");
  const [Alert, setAlert] = useState<{
    isOpen: boolean;
    action?: "Add" | "Edit" | "Delete";
    Item?: Partial<Todolist>;
  }>({ isOpen: false });

  const targetMonth = dayjs(activeDay).format("YYYY-MM");

  const year = dayjs(activeDay).format("YYYY");
  const month = dayjs(activeDay).format("MM");
  const monthKey = dayjs(activeDay).format("YYYY-MM");
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
    const hasTodoColor = (color?: string) => {
      const normalizedColor = color?.trim().toLowerCase();
      return Boolean(normalizedColor && normalizedColor !== "#ffffff");
    };

    return [...mydataTodolist].sort((a, b) => {
      const colorPriority =
        Number(hasTodoColor(b.color)) - Number(hasTodoColor(a.color));

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
        name: todolist.name,
        value: todolist.value || "",
        complete: false,
        createdAt: new Date(),
        datekey: activeDay,
        color: selectedColor,
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
      settodolist({});
      setSelectedColor("#ffffff");
      SetStatusmode(null);
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
    });
    setSelectedColor(todo.color || "#ffffff");
    settodolist({});
  }

  async function saveEditData(id: string) {
    try {
      if (!user?.uid) return;

      const updates: Partial<Todolist> = {
        name: todolist.name ?? editOldDataInput.name,
        value: todolist.value ?? editOldDataInput.value,
        color: selectedColor,
      };

      await services.updateTodo(user.uid, year, month, id, updates);
      updateDayCache(targetMonth, activeDay, (todos) =>
        todos.map((t) => (t.id === id ? { ...t, ...updates, id } : t)),
      );
      alert("Edit To Do Success");
      settodolist({});
      setEditOldDataInput({ name: "", value: "" });
      setEditingId(null);
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
    } catch (error) {
      console.log(error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    settodolist((prav) => ({ ...prav, [name]: value }));
  }
  //-----------------Next Day ------------------
  function handleNextDay() {
    const nextDate = dayjs(activeDay).add(1, "day").format("YYYY-MM-DD");
    navigate(`/to-do-list/${nextDate}`);
  }
  //-----------------Prev Day ------------------
  function handlePrevDay() {
    const prevDate = dayjs(activeDay).subtract(1, "day").format("YYYY-MM-DD");
    navigate(`/to-do-list/${prevDate}`);
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
  }, [user?.uid, targetMonth, year, month]);

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
        />
      )}

      <section className={css("panel")}>
        <header className={css("header")}>
          <div className={css("titleBlock")}>
            <h1 className={css("title")}>To Do List</h1>
            <p className={css("meta")}>{user?.email}</p>
          </div>
          <div className={css("daycontrol")}>
            <button className="prev-day" onClick={handlePrevDay}>
              &lt;
            </button>
            <span className={css("dateBadge")}>{activeDay}</span>
            <button className="next-day" onClick={handleNextDay}>
              &gt;
            </button>
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
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
            <div className={css("formActions")}>
              <button
                className={css("button", "primary")}
                onClick={() =>
                  setAlert({
                    isOpen: true,
                    Item: {
                      name: todolist.name,
                      value: todolist.value,
                      color: selectedColor,
                    },
                    action: "Add",
                  })
                }
              >
                Save Task
              </button>
              <button
                className={css("button", "secondary")}
                onClick={() => {
                  SetStatusmode(null);
                  settodolist({});
                  setSelectedColor("#ffffff");
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : (
          <div className={css("toolbar")}>
            {Statusmode === null ? (
              <>
                <button
                  className={css("button", "primary")}
                  onClick={() => SetStatusmode("Add")}
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
                onClick={() => {
                  SetStatusmode(null);
                  setEditingId(null);
                  settodolist({});
                }}
              >
                Exit Manage Mode
              </button>
            )}
          </div>
        )}

        <section className={css("listShell")}>
          <ul className={css("list")}>
            {sortedTodolist.map((todo) => (
              <li
                key={todo.id}
                className={css("item", todo.complete && "done")}
                style={{ borderLeft: `4px solid ${todo.color || "#e5e7eb"}` }}
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
                        defaultValue={editOldDataInput.name}
                        placeholder="Edit title"
                        onChange={handleChange}
                      />
                      <input
                        className={css("input")}
                        type="text"
                        name="value"
                        defaultValue={editOldDataInput.value}
                        placeholder="Edit description"
                        onChange={handleChange}
                      />
                    </div>
                    <ColorPicker
                      selectedColor={selectedColor}
                      onColorChange={setSelectedColor}
                    />
                    <div className={css("itemActions")}>
                      <button
                        className={css("button", "success")}
                        onClick={() =>
                          setAlert({
                            isOpen: true,
                            Item: {
                              id: todo.id,
                              name: todolist.name,
                              value: todolist.value,
                              color: selectedColor,
                            },
                            action: "Edit",
                          })
                        }
                      >
                        Save
                      </button>
                      <button
                        className={css("button", "secondary")}
                        onClick={() => {
                          SetStatusmode(null);
                          settodolist({});
                          setSelectedColor("#ffffff");
                          setEditingId(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={css("content")}>
                    <h3 className={css("itemTitle")}>{todo.name}</h3>
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
                        setAlert({
                          isOpen: true,
                          Item: {
                            id: todo.id,
                            name: todo.name,
                            value: todo.value,
                          },
                          action: "Delete",
                        });
                        console.log(todo);
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
        </section>
      </section>
    </main>
  );
}
