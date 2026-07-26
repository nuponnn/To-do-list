import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
 
} from "firebase/firestore";
import { db } from "../firebase";


// ฟังก์ชัน Helper ภายในไฟล์ (ไม่ต้อง export)
//UserData/UserID/todos
// const getTodosCol = (uid: string) => collection(db, "UserData", uid, "todos");

//UserData/UserID/todos /year/month
const getTodosCol = (uid: string, year: string, month: string) =>
  collection(db, "UserData", uid, "Years", year, "Months", month, "Tasks");
export interface Todolist {
  id: string;
  name: string;
  value?: string;
  complete: boolean;
  createdAt: Date;
  datekey: string;
  color?: string; // เพิ่มฟิลด์สี (ไม่บังคับ)
  icon?: string;
}
export const services = {
  //-----------------getTodos-----------------
  getTodos: async (uid: string, year: string, month: string) => {
    if (!uid) return;

    try {
      // จิ้มตรงไปที่โฟลเดอร์ ปี > เดือน นั้นๆ เลย ไม่ต้องยิงหว่านแห
      const tasksColRef = getTodosCol(uid, year, month);
      const querySnapshot = await getDocs(tasksColRef);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Todolist[];
    } catch (error) {
      console.error("Error fetching todos:", error);
      return [];
    }
  },
  //-----------------addTodos-----------------
  // รับข้อมูลแบบ Omit<Todolist, 'id'> เพื่อให้ฝั่งหน้าบ้านไม่ต้องส่ง id มา
 addTodo: async (uid: string, year: string, month: string, todolist: Omit<Todolist, 'id'>) => {
    const tasksColRef = getTodosCol(uid, year, month);
    const newTaskRef = doc(tasksColRef); // สุ่ม ID เอกสารงานใหม่

    await setDoc(newTaskRef, {
      ...todolist,
      value: todolist.value || "",
      id: newTaskRef.id // ฝัง ID ลงในตัวข้อมูล
    });
    return newTaskRef.id;
  },
  //-----------------updateTodos-----------------
  updateTodo: async (uid: string, year: string, month: string, id: string, updates: Partial<Todolist>) => {
    const taskDocRef = doc(getTodosCol(uid, year, month), id);
    await updateDoc(taskDocRef, updates);
  },
  //-----------------togglecompleteTodos-----------------
 toggleComplete: async (uid: string, year: string, month: string, id: string, status: boolean) => {
    const taskDocRef = doc(getTodosCol(uid, year, month), id);
    await updateDoc(taskDocRef, { complete: status });
  },
  //-----------------deleteTodos-----------------
 deleteTodo: async (uid: string, year: string, month: string, id: string) => {
    const taskDocRef = doc(getTodosCol(uid, year, month), id);
    await deleteDoc(taskDocRef);
  },
};
