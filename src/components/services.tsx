import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";


// ฟังก์ชัน Helper ภายในไฟล์ (ไม่ต้อง export)
const getTodosCol = (uid: string) => collection(db, "UserData", uid, "todos");

interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datakey: string;
}
export const services = {
  getTodayTodos: async (uid: string,day: string= new Date().toISOString().split("T")[0]) => {
    const qtodos = query(
      getTodosCol(uid),
      where("datakey", "==", day),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const docSnap = await getDocs(qtodos);
    return docSnap.docs.map((doc) => doc.data());
  },
  addTodo: async (uid: string, todolist: Todolist) => {
    await setDoc(doc(getTodosCol(uid), todolist.id), todolist);
  },
  toggleComplete: async (uid: string, id: string, status: boolean) => {
    await updateDoc(doc(getTodosCol(uid), id), { complete: status });
  },
  deleteTodo: async (uid: string, id: string) => {
    await deleteDoc(doc(getTodosCol(uid), id));
  },
};
