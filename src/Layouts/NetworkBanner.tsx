import { UseNetworkStatus } from "../Context/UseNetworkStatus";

export  function NetworkBanner() {
  const { isOnline, wasOffline  } = UseNetworkStatus();

  if (isOnline && !wasOffline) return null; // ปกติ ไม่แสดงอะไร

  return (
    <div style={{
      position: "fixed",
      bottom: "16px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 20px",
      borderRadius: "20px",
      fontSize: "13px",
      fontWeight: 500,
      zIndex: 9999,
      backgroundColor: isOnline ? "#f0fdf4" : "#fef2f2",
      color: isOnline ? "#16a34a" : "#dc2626",
      border: `1px solid ${isOnline ? "#bbf7d0" : "#fecaca"}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}>
      {!isOnline && "⚡ Offline — งานที่บันทึกจะ sync เมื่อมีเน็ต"}
      {isOnline && wasOffline && "✅ กลับมาออนไลน์แล้ว — กำลัง sync..."}
    </div>
  );
}