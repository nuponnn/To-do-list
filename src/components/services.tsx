import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,

} from "firebase/firestore";
import { db } from "../firebase";
import dayjs from "dayjs";


// ฟังก์ชัน Helper ภายในไฟล์ (ไม่ต้อง export)
const getTodosCol = (uid: string) => collection(db, "UserData", uid, "todos");

export interface Todolist {
  id: string;
  name: string;
  value: string;
  complete: boolean;
  createdAt: Date;
  datekey: string;
  color?: string; // เพิ่มฟิลด์สี (ไม่บังคับ)
  icon?:string

}
export const services = {
  getTodos: async (uid: string,day:dayjs.Dayjs|undefined=dayjs()) => {
    if (!uid) return;

      const startOfMonth = day.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = day.endOf("month").format("YYYY-MM-DD");

      const todosQuery = query(
        getTodosCol(uid),
        where("datekey", ">=", startOfMonth),
        where("datekey", "<=", endOfMonth),
      );
      const querySnapshot = await getDocs(todosQuery);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todolist[];
  },
  addTodo: async (uid: string, todolist: Todolist) => {
    await setDoc(doc(getTodosCol(uid), todolist.id), todolist);
  },updateTodo: async (uid: string, id: string, updates: Partial<Todolist>) => {
    await updateDoc(doc(getTodosCol(uid), id), updates);
  },
  toggleComplete: async (uid: string, id: string, status: boolean) => {
    await updateDoc(doc(getTodosCol(uid), id), { complete: status });
  },
  deleteTodo: async (uid: string, id: string) => {
    await deleteDoc(doc(getTodosCol(uid), id));
  },
};
