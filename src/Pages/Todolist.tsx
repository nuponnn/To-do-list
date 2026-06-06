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
}
type Action =
  | { type: "SET_TODOS"; payload: Todolist[] }
  | { type: "ADD_TODO"; payload: Todolist }
  | { type: "UPDATE_TODO"; payload: { id: string; updates: Partial<Todolist> } }
  | { type: "DELETE_TODO"; payload: string };

function todoReducer(state: Todolist[], action: Action): Todolist[] {
  switch (action.type) {
    case "SET_TODOS":
      return action.payload;
    case "ADD_TODO":
      return [action.payload, ...state];
    case "UPDATE_TODO":
      return state.map((t) =>
        t.id === action.payload.id ? { ...t, ...action.payload.updates } : t,
      );

    case "DELETE_TODO":
      return state.filter((todo) => todo.id !== action.payload);
    default:
      return state;
  }
}
//------------------interface------------------
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
  const [editInput, setEditInput] = useState<Partial<Todolist>>({
    name: "",
    value: "",
  });

  //-------------------- fecth data to firebase --------------------
  async function getData() {
    if (!user?.uid) return;
    const data = await services.getTodayTodos(user.uid, activeDay);
    dispatch({ type: "SET_TODOS", payload: data as Todolist[] });
  }

  //-------------------- add data to firebase --------------------
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
      };

      await services.addTodo(user.uid, newTodolist);
      dispatch({ type: "ADD_TODO", payload: newTodolist });
      alert("Add To Do Success");
      settodolist({});
    } catch (error) {
      console.log(error);
    }
  }
  //-------------------- edit data to firebase --------------------

  function handleStartEdit(todo: Todolist) {
    setEditingId(todo.id);
    setEditInput({ name: todo.name, value: todo.value }); // ดึงค่าเก่ามาใส่ในฟอร์มทันที
  }

  async function saveEditData(id: string) {
    try {
      if (!user?.uid) return;
      if (!todolist.name && !todolist.value) {
        alert("กรุณากรอกข้อมูล");
        return;
      }

      const updates: Partial<Todolist> = {
        name: todolist.name ?? editInput.name,
        value: todolist.value ?? editInput.value,
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
  //-------------------- toggle complete --------------------
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
      // setmydataTodolist((prev) => prev.filter((todo) => todo.id !== id));
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
  }, [user?.uid]);

  return (
    <div>
      <h1>To Do List</h1>
      <h2>{user?.email}</h2>
      <h3>{activeDay}</h3>
      {mode !== null ? (
        <>
          <button onClick={() => Setmode(null)}>Cancel</button>
        </>
      ) : null}
      {mode === null ? (
        <>
          <button onClick={() => Setmode("Add")}>Add</button>
          <button onClick={() => Setmode("Edit")}>Edit</button>
          <button onClick={() => Setmode("Delete")}>Delete</button>
        </>
      ) : mode === "Add" ? (
        <>
          <label>
            name:
            <input type="text" name="name" onChange={(e) => handleChange(e)} />
          </label>
          <label>
            value:
            <input type="text" name="value" onChange={(e) => handleChange(e)} />
          </label>
          <button onClick={addData}>Add To Do</button>
        </>
      ) : null}

      <div>
        <ul>
          {[...mydataTodolist.sort((a,b)=>{return Number(a.complete)-Number(b.complete)})].map((todo, index) => (
            <li key={todo.id} className={`todolist-container ${todo.complete ? 'completed' : ''}`}>
              <label>
                {index + 1}
                <input
                  type="checkbox"
                  checked={todo.complete}
                  onChange={() => toggleComplete(todo.id!, todo.complete!)}
                />
              </label>
              {mode === "Edit" && !todo.complete ? (
                <>
                  {editingId === todo.id ? (
                    <>
                    <div className="input-edit-container">

                      <label>
                        name:
                        <input
                          type="text"
                          name="name"
                          placeholder={editInput.name}
                          onChange={(e) => handleChange(e)}
                        />
                      </label>
                      <label>
                        Subtitles:
                        <input
                          type="text"
                          name="value"
                          placeholder={editInput.value}
                          onChange={(e) => handleChange(e)}
                        />
                      </label>
                      <div>

                      <button onClick={() => saveEditData(todo.id!)}>
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}>Cancel

                      </button>
                      </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="todo-content">
                        <h3>todo:{todo.name}</h3>
                        <p>Subtitles:{todo.value}</p>
                      </div>
                      <button onClick={() => handleStartEdit(todo)}>
                        Edit
                      </button>
                    </>
                  )}
                </>
              ) : mode === "Delete" ? (
                <>
                <div className="todo-content">
                    <h3>todo:{todo.name}</h3>
                    <p>Subtitles:{todo.value}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (todo.id) {
                        DeleteData(todo.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <div className="todo-content">
                    <h3>todo:{todo.name}</h3>
                    <p>Subtitles:{todo.value}</p>
                  </div>
                </>
              )}

              <br />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
