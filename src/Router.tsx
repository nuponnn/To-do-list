/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from "react-router-dom";
import { lazy } from "react";
import MainLayout from "./Layouts/Mainlayout.tsx";
import ProtectedRoute from "./Context/ProtectedRoute.tsx";

const App = lazy(() => import("./Pages/App.tsx"));
const Calendar = lazy(() => import("./Pages/Calendar.tsx"));
const Todolist = lazy(() => import("./Pages/Todolist.tsx"));
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute allowAuthenticated={false} fallbackPath="/calendar">
            <App />
          </ProtectedRoute>
        ),
      },
      {
        path: "/calendar",
        element: (
          <ProtectedRoute allowAuthenticated={true} fallbackPath="/">
            <Calendar />
          </ProtectedRoute>
        ),
      },
      {
        path: "/to-do-list/:day",
        element: (
          <ProtectedRoute allowAuthenticated={true} fallbackPath="/">
            <Todolist />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
export { router };
