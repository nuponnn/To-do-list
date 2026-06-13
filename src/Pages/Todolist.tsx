import { useState, useEffect, useReducer } from "react";
import { AuthContext } from "../Context/AuthPreventContext";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";
import "../assets/css/Todolist.css";
import { services } from "../components/services";

interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datekey: string;
  color?: string;
}
type Action =
  | { type: "SET_TODOS"; payload: Todolist[] }
  | { type: "ADD_TODO"; payload: Todolist }
  | { type: "UPDATE_TODO"; payload: { id: string; updates: Partial<Todolist> } }
  | { type: "DELETE_TODO"; payload: string };

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

function todoReducer(state: Todolist[], action: Action): Todolist[] {
  switch (action.type) {
    case "SET_TODOS":
      return action.payload;
    case "ADD_TODO":
      return [action.payload, ...state];
    case "UPDATE_TODO":
      return state.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
      );
    case "DELETE_TODO":
      return state.filter((todo) => todo.id !== action.payload);
    default:
      return state;
  }
}

export default function Todolist() {
  const { user } = AuthContext();
  const { day } = useParams();
  
  useEffect(() => {
    if (!user || !user.uid) return;
  }, [user]);

  const [todolist, settodolist] = useState<Partial<Todolist>>({});
  const [mydataTodolist, dispatch] = useReducer(todoReducer, []);
  const activeDay = day || new Date().toISOString().split("T")[0];
  const [mode, Setmode] = useState<"Add" | "Edit" | "Delete" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState<Partial<Todolist>>({ name: "", value: "" });
  const [selectedColor, setSelectedColor] = useState<string>("#ffffff");

  async function getData() {
    if (!user?.uid) return;
    const data = await services.getTodayTodos(user.uid, activeDay);
    dispatch({ type: "SET_TODOS", payload: data as Todolist[] });
  }

  async function addData() {
    try {
      if (!user?.uid) return;
      if (!todolist.name || !todolist.value) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
      const newTodolist: Todolist = {
        id: nanoid(10),
        name: todolist.name,
        value: todolist.value,
        complete: false,
        createdAt: new Date(),
        datekey: activeDay,
        color: selectedColor,
      };

      await services.addTodo(user.uid, newTodolist);
      dispatch({ type: "ADD_TODO", payload: newTodolist });
      alert("Add To Do Success");
      settodolist({});
      setSelectedColor("#ffffff");
      Setmode(null);
    } catch (error) {
      console.log(error);
    }
  }

  function handleStartEdit(todo: Todolist) {
    setEditingId(todo.id);
    setEditInput({ name: todo.name, value: todo.value });
    setSelectedColor(todo.color || "#ffffff");
  }

  async function saveEditData(id: string) {
    try {
      if (!user?.uid) return;
      
      const updates: Partial<Todolist> = {
        name: todolist.name || editInput.name,
        value: todolist.value || editInput.value,
        color: selectedColor,
      };

      await services.updateTodo(user.uid, id, updates);
      dispatch({
        type: "UPDATE_TODO",
        payload: { id, updates },
      });
      alert("Edit To Do Success");
      settodolist({});
      setEditInput({ name: "", value: "" });
      setEditingId(null);
    } catch (error) {
      console.log(error);
    }
  }

  async function toggleComplete(id: string, currentStats: boolean) {
    try {
      if (!user?.uid) return;
      await services.toggleComplete(user.uid, id, !currentStats);
      dispatch({
        type: "UPDATE_TODO",
        payload: { id, updates: { complete: !currentStats } },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async function DeleteData(id: string) {
    try {
      if (!user?.uid) return;
      await services.deleteTodo(user.uid, id);
      dispatch({
        type: "DELETE_TODO",
        payload: id,
      });
      alert("Delete To Do Success");
    } catch (error) {
      console.log(error);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    settodolist((prav) => ({ ...prav, [name]: value }));
  }

  useEffect(() => {
    getData();
  }, [user?.uid, activeDay]);

  return (
    <div className="todo-page-container">
      <header className="todo-header">
        <h1>To Do List</h1>
        <p className="user-email">{user?.email}</p>
        <span className="active-date">{activeDay}</span>
      </header>

      {/* ฟอร์มสำหรับการเพิ่มงาน (Add Mode) */}
      {mode === "Add" && (
        <div className="form-card animate-fade">
          <h3>Create New Task</h3>
          <div className="input-group">
            <label>Task Title:</label>
            <input type="text" name="name" value={todolist.name || ""} onChange={handleChange} placeholder="e.g., Homework" />
          </div>
          <div className="input-group">
            <label>Description:</label>
            <input type="text" name="value" value={todolist.value || ""} onChange={handleChange} placeholder="e.g., Page 15 to 20" />
          </div>
          <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={addData}>Save Task</button>
            <button className="btn btn-secondary" onClick={() => Setmode(null)}>Cancel Task</button>
          </div>
        </div>
      )}

      {/* โหมดควบคุมหลักตอนเปิดปกติ */}
      {mode !== "Add" && (
        <div className="menu-control-bar">
          {mode !== null ? (
            <button className="btn btn-secondary" onClick={() => Setmode(null)}>Exit Manage Mode</button>
          ) : (
            <div className="action-main-buttons">
              <button className="btn btn-primary" onClick={() => Setmode("Add")}>＋ Add Task</button>
              <button className="btn btn-outline" onClick={() => Setmode("Edit")}>✏️ Edit Task</button>
              <button className="btn btn-danger-outline" onClick={() => Setmode("Delete")}>🗑️ Delete Task</button>
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
                  {mode === "Edit" && !todo.complete ? (
                    editingId === todo.id ? (
                      <div className="input-edit-container animate-fade">
                        <div className="input-group">
                          <input
                            type="text"
                            name="name"
                            defaultValue={editInput.name}
                            placeholder="Edit title"
                            onChange={handleChange}
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="text"
                            name="value"
                            defaultValue={editInput.value}
                            placeholder="Edit description"
                            onChange={handleChange}
                          />
                        </div>
                        <ColorPicker selectedColor={selectedColor} onColorChange={setSelectedColor} />
                        <div className="edit-actions">
                          <button className="btn btn-success-sm" onClick={() => saveEditData(todo.id)}>บันทึก</button>
                          <button className="btn btn-secondary-sm" onClick={() => setEditingId(null)}>ยกเลิก</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="todo-content">
                          <h3>{todo.name}</h3>
                          <p>{todo.value}</p>
                        </div>
                        <button className="btn btn-edit-sm" onClick={() => handleStartEdit(todo)}>Edit</button>
                      </>
                    )
                  ) : mode === "Delete" ? (
                    <>
                      <div className="todo-content">
                        <h3>{todo.name}</h3>
                        <p>{todo.value}</p>
                      </div>
                      <button className="btn btn-danger-sm" onClick={() => DeleteData(todo.id)}>Delete</button>
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
  );
}