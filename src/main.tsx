import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
// import {BrowserRouter, Routes, Route, createBrowserRouter} from 'react-router-dom'
import "./assets/css/index.css";
import AuthPreventContext from "./Context/AuthPreventContext";
import { router } from "./Router";
import TodoProvider from "./Context/TodoProvider";

import AppReadyProviderContext, {
  useAppReady,
} from "./Context/AppReadyProviderContext";
function TodoSkeleton() {
  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 24 }}>
      <div
        style={{
          height: 28,
          width: 140,
          background: "#eee",
          borderRadius: 8,
          margin: "0 auto 20px",
        }}
      />
      <div
        style={{
          height: 60,
          background: "#f5f5f5",
          borderRadius: 12,
          marginBottom: 10,
        }}
      />
      <div
        style={{
          height: 60,
          background: "#f5f5f5",
          borderRadius: 12,
          marginBottom: 10,
        }}
      />
      <div style={{ height: 60, background: "#f5f5f5", borderRadius: 12 }} />
    </div>
  );
}

function AppGate({ children }: { children: React.ReactNode }) {
  const ready = useAppReady();
  if (!ready) return <TodoSkeleton />;
  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* 2. ส่งค่า router เข้าไปใน Provider */}
    <Suspense fallback="Loading...">
      <AuthPreventContext>
        <TodoProvider>
          <AppReadyProviderContext>
            <AppGate>
              <RouterProvider router={router} />
            </AppGate>
          </AppReadyProviderContext>
        </TodoProvider>
      </AuthPreventContext>
    </Suspense>
  </StrictMode>,
);
