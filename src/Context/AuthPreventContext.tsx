import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,

} from "firebase/auth";
import type {  User,
  UserCredential,} from "firebase/auth";

export interface AuthContextType {
  user: User | null;
  // loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}
const UserAuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthPreventContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setuser] = useState<User | null>(null);

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }
  function logout() {
    return signOut(auth);
  }
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setuser(user);
      console.log("user", user);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <>
      <UserAuthContext.Provider value={{ user, login, signup, logout }}>
        {children}
      </UserAuthContext.Provider>
    </>
  );
}

export function AuthContext() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error("AuthContext must be used within an AuthPreventContext");
  }
  return context;
}
