import { doc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from "react";

interface MyData {
  uid?: string;
  name?: string;
  allTodolists?:Record<string, Todolist>;
}

interface Todolist {
  id?:string;
  name?:string;
  value?:string;
  complete?:boolean;
}
export default function Todolist() {
  const [todolist, settodolist] = useState<Todolist>({});
  const todocol = collection(db, "todos");
  async function addData() {
    try {
      await addDoc(todocol, todolist);
    } catch (error) {
      console.log(error);
    }
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const {name, value} = e.target;
    settodolist((prav) => ({ ...prav,
         [name]: value }));
  }
  return (
    <div>
      <h1>To Do List</h1>
      <input type="text" name="name" onChange={(e) => handleChange(e)} />
      <button onClick={addData}>Add To Do</button>
    </div>
  );
}
