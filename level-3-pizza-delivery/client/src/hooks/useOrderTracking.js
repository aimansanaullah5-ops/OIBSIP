
import { useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

function useOrderTracking(onOrderStatusUpdated) {
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      console.log("Real-time order tracking connected");
    });

    socket.on("connect_error", (error) => {
      console.error("Order tracking connection error:", error.message);
    });

    socket.on("orderStatusUpdated", (update) => {
      onOrderStatusUpdated(update);
    });

    return () => {
      socket.disconnect();
    };
  }, [onOrderStatusUpdated]);
}

export default useOrderTracking;
