import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from "./Layouts/Mainlayout.tsx";
import dayjs from 'dayjs';

const App = lazy(() => import('./Pages/App.tsx'));
const Calendar = lazy(() => import('./Pages/Calendar.tsx'));
const Todolist = lazy(() => import('./Pages/Todolist.tsx'));
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/calendar", element: <Calendar /> }, 
      {path: "/to-do-list/:day", element: <Todolist />},
      

    ],
  },
]);
export  { router }