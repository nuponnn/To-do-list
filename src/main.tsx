import ReactDOM from "react-dom/client";
import { StrictMode } from 'react'
import { Suspense} from "react";
import { RouterProvider} from 'react-router-dom'
// import {BrowserRouter, Routes, Route, createBrowserRouter} from 'react-router-dom'
import './assets/css/index.css'
import AuthPreventContext from "./Context/AuthPreventContext";
import { router } from './Router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. ส่งค่า router เข้าไปใน Provider */}
    <Suspense fallback="Loading...">
      <AuthPreventContext>
        <RouterProvider router={router} />
      </AuthPreventContext>
    </Suspense>
  </StrictMode>,
)
