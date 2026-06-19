import { useState, useEffect, useReducer, useMemo } from "react";
import { AuthContext } from "../Context/AuthPreventContext";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";
import "../assets/css/Todolist.css";
import { services } from "../components/services";
import Alertconfirm from "../components/Alertconfirm";
import { useTodo } from "../Context/TodoProvider";
import dayjs from "dayjs";

interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datekey: string;
  color?: string;
}
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
    <div className="color-picker-container">
      <span className="color-picker-label">เลือกสีแท็ก:</span>
      <div className="color-buttons">
        {defaultColors.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => onColorChange(c.code)}
            style={{
              backgroundColor: c.code,
              outline: selectedColor === c.code ? "3px solid #000" : "none",
              outlineOffset: "2px",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            className="color-dot"
          />
        ))}
        <label className="custom-color-label">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
          />
          <span>custom</span>
        </label>
      </div>
    </div>
  );
}

// function todoReducer(state: Todolist[], action: Action): Todolist[] {
//   switch (action.type) {
//     case "SET_TODOS":
//       return action.payload;
//     case "ADD_TODO":
//       return [action.payload, ...state];
//     case "UPDATE_TODO":
//       return state.map((t) =>
//         t.id === action.payload.id ? { ...t, ...action.payload.updates } : t,
//       );
//     case "DELETE_TODO":
//       return state.filter((todo) => todo.id !== action.payload);
//     default:
//       return state;
//   }
// }

export default function Todolist() {
  const { user, loading } = AuthContext();
  const { day } = useParams();
  const { setTodosCache, todosCache } = useTodo();

  useEffect(() => {
    if (!user || !user.uid) return;
  }, [user]);

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
    Item?: Partial<Todolist>;
  }>({ isOpen: false });

  const targetMonth = dayjs(day).format("YYYY-MM");

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

  //-----------------Get Data ------------------
  async function getData() {
    if (!user?.uid) return;
    const data = await services.getTodayTodos(user.uid, activeDay);
    updateDayCache(targetMonth, activeDay, () => data as Todolist[]);
  }

  const mydataTodolist = useMemo(
    () => todosCache[targetMonth]?.[activeDay] || [],
    [todosCache, targetMonth, activeDay],
  );
  function Isconfirm() {
    switch (Statusmode) {
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
      if (!todolist.name || !todolist.value) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
      const docId = nanoid(10);
      const newTodolist: Todolist = {
        id: docId,
        name: todolist.name,
        value: todolist.value,
        complete: false,
        createdAt: new Date(),
        datekey: activeDay,
        color: selectedColor,
      };

      await services.addTodo(user.uid, newTodolist);
      // dispatch({ type: "ADD_TODO", payload: newTodolist });
      updateDayCache(targetMonth, activeDay, (todo) => [...todo, newTodolist]);
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
    setEditOldDataInput({ name: todo.name, value: todo.value });
    setSelectedColor(todo.color || "#ffffff");
  }

  async function saveEditData(id: string) {
    try {
      if (!user?.uid) return;

      const updates: Partial<Todolist> = {
        name: todolist.name ?? editOldDataInput.name,
        value: todolist.value ?? editOldDataInput.value,
        color: selectedColor,
      };
      const targetMonth = dayjs(activeDay).format("YYYY-MM");
      await services.updateTodo(user.uid, id, updates);
      // dispatch({
      //   type: "UPDATE_TODO",
      //   payload: { id, updates },
      // });

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
      await services.toggleComplete(user.uid, id, !currentStats);
      // dispatch({
      //   type: "UPDATE_TODO",
      //   payload: { id, updates: { complete: !currentStats } },
      // });

      updateDayCache(targetMonth, activeDay, (todos) =>
        todos.map((t) =>
          t.id === id ? { ...t, complete: !currentStats, id } : t,
        ),
      );
    } catch (error) {
      console.log(error);
    }
  }
  //-----------------Delete Data ------------------

  async function DeleteData(id: string) {
    try {
      if (!user?.uid) return;
      await services.deleteTodo(user.uid, id);

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
  //-----------------useEffect ------------------

  useEffect(() => {
    if (!user?.uid) return;
    if (todosCache[targetMonth]?.[activeDay]) return;
    getData();
  }, [user?.uid, targetMonth, activeDay]);
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading App...</div>
    );
  }

  return (
    <div className="todo-page-container">
      {Alert.isOpen && (
        <Alertconfirm
          DataOpenAlert={Alert}
          SetOpenAlert={setAlert}
          Isconfirm={Isconfirm}
          StatusMode={Statusmode}
          OldData={editOldDataInput}
        />
      )}
      <div className="todo-page-container">
        <header className="todo-header">
          <h1>To Do List</h1>
          <p className="user-email">{user?.email}</p>
          <span className="active-date">{activeDay}</span>
        </header>

        {/* ฟอร์มสำหรับการเพิ่มงาน (Add Mode) */}
        {Statusmode === "Add" && (
          <div className="form-card animate-fade">
            <h3>Create New Task</h3>
            <div className="input-group">
              <label className="label-input">Task Title:</label>
              <input
                type="text"
                name="name"
                value={todolist.name || ""}
                onChange={handleChange}
                placeholder="e.g., Homework"
              />
            </div>
            <div className="input-group">
              <label className="label-input">Description:</label>
              <input
                type="text"
                name="value"
                value={todolist.value || ""}
                onChange={handleChange}
                placeholder="e.g., Page 15 to 20"
              />
            </div>
            <ColorPicker
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
            <div className="form-actions">
              <button
                className="btn btn-primary"
                onClick={() =>
                  setAlert({
                    isOpen: true,
                    Item: { name: todolist.name, value: todolist.value },
                  })
                }
              >
                Save Task
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  SetStatusmode(null);
                  settodolist({});
                  setSelectedColor("#ffffff");
                  setEditingId(null);
                }}
              >
                Cancel Task
              </button>
            </div>
          </div>
        )}

        {/* โหมดควบคุมหลักตอนเปิดปกติ */}
        {Statusmode !== "Add" && (
          <div className="menu-control-bar">
            {Statusmode !== null ? (
              <button
                className="btn btn-secondary"
                onClick={() => SetStatusmode(null)}
              >
                Exit Manage Mode
              </button>
            ) : (
              <div className="action-main-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => SetStatusmode("Add")}
                >
                  ＋ Add Task
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => SetStatusmode("Edit")}
                >
                  ✏️ Edit Task
                </button>
                <button
                  className="btn btn-danger-outline"
                  onClick={() => SetStatusmode("Delete")}
                >
                  🗑️ Delete Task
                </button>
              </div>
            )}
          </div>
        )}

        {/* รายการ Todo Lists */}
        <div className="todolist-container">
          <ul className="todo-list-wrapper">
            {[...mydataTodolist]
              .sort((a, b) => Number(a.complete) - Number(b.complete))
              .map((todo) => (
                <li
                  key={todo.id}
                  className={`todolist-list ${todo.complete ? "completed" : ""}`}
                  style={{
                    borderLeft: `6px solid ${todo.color || "#e0e0e0"}`,
                  }}
                >
                  <div className="todo-item-left">
                    <input
                      type="checkbox"
                      className="todo-checkbox"
                      checked={todo.complete}
                      onChange={() => toggleComplete(todo.id, todo.complete)}
                    />
                  </div>

                  <div className="todo-item-body">
                    {Statusmode === "Edit" && !todo.complete ? (
                      editingId === todo.id ? (
                        <div className="input-edit-container animate-fade">
                          <div className="input-group">
                            <input
                              type="text"
                              name="name"
                              defaultValue={editOldDataInput.name}
                              placeholder="Edit title"
                              onChange={handleChange}
                            />
                          </div>
                          <div className="input-group">
                            <input
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
                          <div className="edit-actions">
                            <button
                              className="btn btn-success-sm"
                              onClick={() =>
                                setAlert({
                                  isOpen: true,
                                  Item: {
                                    id: todo.id,
                                    name: todolist.name,
                                    value: todolist.value,
                                  },
                                })
                              }
                            >
                              Save Task
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                SetStatusmode(null);
                                settodolist({});
                                setSelectedColor("#ffffff");
                                setEditingId(null);
                              }}
                            >
                              Cancel Task
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="todo-content">
                            <h3>{todo.name}</h3>
                            <p>{todo.value}</p>
                          </div>
                          <button
                            className="btn btn-edit-sm"
                            onClick={() => handleStartEdit(todo)}
                          >
                            Edit
                          </button>
                        </>
                      )
                    ) : Statusmode === "Delete" ? (
                      <>
                        <div className="todo-content">
                          <h3>{todo.name}</h3>
                          <p>{todo.value}</p>
                        </div>
                        <button
                          className="btn btn-danger-sm"
                          onClick={() =>
                            setAlert({
                              isOpen: true,
                              Item: {
                                id: todo.id,
                                name: todo.name,
                                value: todo.value,
                              },
                            })
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <div className="todo-content">
                        <h3>{todo.name}</h3>
                        <p>{todo.value}</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
          {mydataTodolist.length === 0 && (
            <p className="empty-state">No tasks available for today</p>
          )}
        </div>
      </div>
    </div>
  );
}
