import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from "./Layouts/Mainlayout.tsx";

const App = lazy(() => import('./Pages/App.tsx'));
const Test = lazy(() => import('./Pages/Test.tsx'));
const Calendar = lazy(() => import('./Pages/Calendar.tsx'));
const Todolist = lazy(() => import('./Pages/Todolist.tsx'));
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/test", element: <Test /> },
      { path: "/calendar", element: <Calendar /> }, 
      {path: "/to-do-list", element: <Todolist />},

    ],
  },
]);
export  { router }