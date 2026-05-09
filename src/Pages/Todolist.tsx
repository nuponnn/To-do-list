import { useState, useEffect, useReducer } from "react";
import { AuthContext } from "../Context/AuthPreventContext";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";

import { services } from "../components/services";
// interface MyData {
//   uid?: string;
//   email?: string;
// }

interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datakey:string;
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

export default function Todolist() {
  const { user } = AuthContext();
  const { day } = useParams();
  useEffect(() => {
    if (!user || !user.uid) return;
  }, [user]);
  const [todolist, settodolist] = useState<Partial<Todolist>>({});

  const [mydataTodolist, dispatch] = useReducer(todoReducer, []);
const activeDay = day || new Date().toISOString().split("T")[0];

  async function getData() {
    if (!user?.uid) return;
    const data = await services.getTodayTodos(user.uid,activeDay);
    dispatch({ type: "SET_TODOS", payload: data as Todolist[] });
  }

  //-------------------- add data to firebase --------------------
  async function addData() {
    try {
      if(!user?.uid) return;
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
        datakey :new Date().toISOString().split("T")[0],
      };

      await services.addTodo(user.uid, newTodolist);
      dispatch({type:"ADD_TODO",payload:newTodolist});
      alert("Add To Do Success");
      settodolist({});
    } catch (error) {
      console.log(error);
    }
  }
  async function toggleComplete(id: string, currentStats: boolean) {
    try {
      if(!user?.uid) return;
      await services.toggleComplete(user.uid, id, !currentStats);
      dispatch({
        type: "UPDATE_TODO",
        payload: { id, updates: { complete: !currentStats } },
      });
    } catch (error) {
      console.log(error);
    }
  }
  async function DeleteData(id: string ) {
    try {
      if(!user?.uid) return;
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
      <label>
        name:
        <input type="text" name="name" onChange={(e) => handleChange(e)} />
      </label>
      <label>
        value:
        <input type="text" name="value" onChange={(e) => handleChange(e)} />
      </label>
      <button onClick={addData}>Add To Do</button>
      <div>
        <ul>
          {mydataTodolist.map((todo,index) => (
            <li key={todo.id}>
              <label >
{index+1}
              <input type="checkbox" checked={todo.complete} onChange={()=>toggleComplete(todo.id!,todo.complete!)} />
              </label>

              <h3>todo:{todo.name}</h3>
              <p>{todo.value}</p>
              <button onClick={() => {if(todo.id){DeleteData(todo.id)}}}>Delete</button>
              <br />
              
            </li>
          ))}
        </ul>
        
      </div>
    </div>
  );
}
