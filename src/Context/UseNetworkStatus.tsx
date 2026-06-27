import { useState, useEffect } from "react";
export  function UseNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setwasOffline] = useState(false);
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      setwasOffline(true); // เพิ่งกลับมา → จะได้แสดง Syncing...
      setTimeout(() => setwasOffline(false), 3000); // ซ่อน banner หลัง 3 วิ
    }
    function handleOffline() {
      setIsOnline(false);
      setwasOffline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return { isOnline, wasOffline };
}
