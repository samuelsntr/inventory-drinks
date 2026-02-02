import { useEffect } from "react";
import { io } from "socket.io-client";

export function useSocket(event, callback) {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_URL);

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on(event, (data) => {
      console.log(`Received event ${event}`);
      callback(data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [event, callback]);
}
