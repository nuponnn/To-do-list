import { Fragment, type ReactNode } from "react";
import { AuthContext } from "./AuthPreventContext";

export default function UserScope({ children }: { children: ReactNode }) {
  const { user } = AuthContext();

  return <Fragment key={user?.uid ?? "guest"}>{children}</Fragment>;
}