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
  loading: boolean;
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
 const [loading, setLoading] = useState(true);
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
      setLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <>
      <UserAuthContext.Provider value={{ user, loading, login, signup, logout }}>
        {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#64748b", fontFamily: "sans-serif" }}>
          Loading Application...
        </div>
      ) : (
        children
      )}
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
