/* eslint-disable react-refresh/only-export-components */
import React, { useContext,useEffect,useState,createContext } from "react"

const AppReadyContext=createContext<boolean>(false);

export default function AppReadyProviderContext({children}:{children:React.ReactNode}) {
const[ready,setready]=useState<boolean>(typeof document !=="undefined"&&document.readyState==="complete")

useEffect(()=>{
    if(ready)return;
    const hanleLoad=()=>setready(true);
    window.addEventListener("load",hanleLoad);
    return()=>window.removeEventListener("load",hanleLoad);
},[ready])

  return (
    <AppReadyContext.Provider value={ready}>
        {children}
    </AppReadyContext.Provider>
  
  )
}
export function useAppReady() {
  return useContext(AppReadyContext);
}