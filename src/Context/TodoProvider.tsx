/* eslint-disable react-refresh/only-export-components */
import { createContext,useState,useContext } from "react";
import { type Todolist } from "../components/services";

interface TodoContextType {
  todosCache: Record<string, Record<string, Todolist[]>>;
  setTodosCache: React.Dispatch<React.SetStateAction<Record<string, Record<string, Todolist[]>>>>;
}
const TodoContext = createContext<TodoContextType | undefined>(undefined);

export default function TodoProvider({ children }: { children: React.ReactNode }) {
  const [todosCache, setTodosCache] = useState<Record<string,Record<string, Todolist[]>>>({});

  return (
    <TodoContext.Provider value={{ todosCache, setTodosCache }}>
      {children}
    </TodoContext.Provider>
  );
}
export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) throw new Error("useTodo must be used within a TodoProvider");
  return context;
};