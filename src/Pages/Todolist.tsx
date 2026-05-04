import {
  doc,
  collection,
  updateDoc,
  setDoc,
  query,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";
import { useState, useEffect } from "react";
import { AuthContext } from "../Context/AuthPreventContext";
import { nanoid } from "nanoid";

interface MyData {
  uid?: string;
  email?: string;
}

interface Todolist {
  id?: string;
  name?: string;
  value?: string;
  complete?: boolean;
  createdAt?: Date;
}

export default function Todolist() {
  const { user } = AuthContext();
  useEffect(() => {
    if (!user || !user.uid) return;
  }, [user]);
  const [todolist, settodolist] = useState<Todolist>({});
  const [mydataTodolist, setmydataTodolist] = useState<Todolist[]>([]);

  //const Todocol = collection(db, "UserData");
  function getTodosCol() {
    if (!user || !user.uid) throw new Error("User not found");
    return collection(db, "UserData", user.uid, "todos");
  }
  async function getData() {
    const qtodos = query(
      getTodosCol(),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const docSnap = await getDocs(qtodos);

    const newData = docSnap.docs.map((doc) => doc.data()) as Todolist[];
    setmydataTodolist(newData);
  }
  async function addData() {
    try {
      if (!todolist.name || !todolist.value) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
      }
      const targetId: string = nanoid(10);
      const newTodolist: Todolist = {
        id: targetId,
        name: todolist.name,
        value: todolist.value,
        complete: false,
        createdAt: new Date(),
      };

      await setDoc(doc(getTodosCol(), targetId), newTodolist);
      setmydataTodolist((prev) => [newTodolist, ...prev]);
      alert("Add To Do Success");
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
          <li>
            {mydataTodolist.map((todo) => (
              <div key={todo.id}>
                <h3>{todo.name}</h3>
                <p>{todo.value}</p>
                <br /> 
              </div>
            ))}
          </li>
        </ul>
      </div>
    </div>
  );
}
