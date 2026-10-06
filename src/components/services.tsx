import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  orderBy,
addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { toTagColor, toTextColor, type TagColor } from "../constants/color";


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
  color?: TagColor; // ไม่บังคับ — ไม่มี field = ไม่มีสี
  textColor?: TagColor; // สีตัวอักษร ถ้าไม่มีจะคำนวณจากพื้นหลังให้อัตโนมัติ
  icon?: string;
}
export interface QuickTodo {
  id: string; // ID ของ Quick Todo
  name: string; // ชื่อ Todo
  value?: string; // ค่าของ Todo (ไม่บังคับ)
  color?: TagColor; // ไม่มี field = ไม่มีสี
  textColor?: TagColor;
}

export interface SavedColor {
  id: string; // ID ของสีที่ผู้ใช้บันทึกไว้
  hex: TagColor; // hex สีที่ผู้ใช้เลือกเอง
}

// ---------------- Runtime parsers ----------------
// ข้อมูลที่อ่านมาจาก Firestore/localStorage เป็น any ทั้งหมด
// ต้องตรวจรูปแบบจริงทุกครั้ง และคืน null ถ้าไม่ผ่าน แทนการ cast ด้วย as
// เอกสารที่ข้อมูลไม่ครบจะถูกทิ้งแทนที่จะไหลไปถึง UI แบบเงียบๆ

const asRecord = (raw: unknown): Record<string, unknown> | null =>
  typeof raw === "object" && raw !== null ? { ...raw } : null;

const readString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const readTagColor = (value: unknown): TagColor | undefined =>
  toTagColor(value);

const readTextColor = (value: unknown): TagColor | undefined =>
  toTextColor(value);

// Firestore เก็บ Timestamp แต่ type ประกาศไว้เป็น Date → แปลงจริงตอนอ่าน
// ค่า new Date(0) คือ sentinel ของ "อ่านไม่ได้" (ไม่มีโค้ดไหนอ่าน field นี้อยู่)
const readDate = (value: unknown): Date => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date(0);
};

export const parseTodolist = (raw: unknown): Todolist | null => {
  const data = asRecord(raw);
  if (!data) return null;

  const id = readString(data.id);
  const name = readString(data.name);
  const datekey = readString(data.datekey);
  if (!id || !name || !datekey) return null;

  return {
    id,
    name,
    value: typeof data.value === "string" ? data.value : "",
    complete: data.complete === true,
    createdAt: readDate(data.createdAt),
    datekey,
    // color เป็น optional ของ Todolist และ UI ใช้ ?? / || เป็น fallback อยู่แล้ว
    // ถ้าไม่มีในเอกสาร (หรือเป็นสีที่ระบบไม่รับ) ต้องคง undefined ไว้ ไม่ใช่แปลงเป็นสีอื่น
    color: readTagColor(data.color),
    textColor: readTextColor(data.textColor),
    icon: readString(data.icon),
  };
};

export const parseQuickTodo = (raw: unknown): QuickTodo | null => {
  const data = asRecord(raw);
  if (!data) return null;

  const id = readString(data.id);
  const name = readString(data.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    value: typeof data.value === "string" ? data.value : undefined,
    color: readTagColor(data.color),
    textColor: readTextColor(data.textColor),
  };
};

export const parseSavedColor = (raw: unknown): SavedColor | null => {
  const data = asRecord(raw);
  if (!data) return null;

  const id = readString(data.id);
  const hex = readTagColor(data.hex);
  if (!id || !hex) return null;

  return { id, hex };
};

export const services = {
  // ---------------- get Quick Todos in User ----------------
  getQuickTodos: async (uid: string): Promise<QuickTodo[]> => {
    if (!uid) return [];

    try {
      const q = query(
        collection(db, "UserData", uid, "quick_todos"),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => parseQuickTodo({ id: doc.id, ...doc.data() }))
        .filter((todo): todo is QuickTodo => todo !== null);
    } catch (error) {
      console.error("Error fetching quick todos:", error);
      return [];
    }
  },
  // ----------------save Quick Todo in Database----------------
  addQuickTodo: async (
    uid: string,
    todo: Omit<QuickTodo, "id">
  ) => {
    const docRef = await addDoc(
      collection(db, "UserData", uid, "quick_todos"),
      {
        ...todo,
        createdAt: serverTimestamp(),
      }
    );
    return docRef.id;
  },
  // ----------------delete Quick Todo in Database----------------
  deleteQuickTodo: async (uid: string, id: string) => {
    const docRef = doc(db, "UserData", uid, "quick_todos", id);
    await deleteDoc(docRef);
  },

  // ---------------- get Saved Colors in User ----------------
  getSavedColors: async (uid: string): Promise<SavedColor[]> => {
    if (!uid) return [];

    try {
      const q = query(
        collection(db, "UserData", uid, "saved_colors"),
        orderBy("createdAt", "asc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => parseSavedColor({ id: doc.id, ...doc.data() }))
        .filter((color): color is SavedColor => color !== null);
    } catch (error) {
      console.error("Error fetching saved colors:", error);
      return [];
    }
  },
  // ----------------save Color in Database----------------
  addSavedColor: async (uid: string, hex: TagColor) => {
    const docRef = await addDoc(
      collection(db, "UserData", uid, "saved_colors"),
      {
        hex,
        createdAt: serverTimestamp(),
      }
    );
    return docRef.id;
  },
  // ----------------delete Saved Color in Database----------------
  deleteSavedColor: async (uid: string, id: string) => {
    const docRef = doc(db, "UserData", uid, "saved_colors", id);
    await deleteDoc(docRef);
  },

  //-----------------getTodos-----------------
  getTodos: async (
    uid: string,
    year: string,
    month: string,
  ): Promise<Todolist[]> => {
    if (!uid) return [];

    try {
      // จิ้มตรงไปที่โฟลเดอร์ ปี > เดือน นั้นๆ เลย ไม่ต้องยิงหว่านแห
      const tasksColRef = getTodosCol(uid, year, month);
      const querySnapshot = await getDocs(tasksColRef);

      return querySnapshot.docs
        .map((doc) => parseTodolist({ id: doc.id, ...doc.data() }))
        .filter((todo): todo is Todolist => todo !== null);
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
    // "ไม่มีสี" แทนด้วย undefined แต่ Firestore เขียน undefined ไม่ได้
    // แปลงเป็น deleteField เพื่อให้ field เดิมถูกลบจริง ๆ (เช่น user กด "ล้าง" สีตัวอักษร)
    const payload = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        value === undefined ? deleteField() : value,
      ]),
    );
    await updateDoc(taskDocRef, payload);
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
