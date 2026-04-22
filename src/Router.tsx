import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from "./Layouts/Mainlayout.tsx";

const App = lazy(() => import('./Pages/App.tsx'));
const Test = lazy(() => import('./Pages/Test.tsx'));

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/test", element: <Test /> },
    ],
  },
]);
export  { router }