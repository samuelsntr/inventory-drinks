import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios"; // ← pastikan ini instance axios yang include cookie

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Cek session saat app pertama kali dibuka
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch (err) {
        setUser(null); // sesi tidak valid
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // ✅ Saat login berhasil
  const login = (userData) => {
    setUser(userData); // backend sudah set session, cukup set state
  };

  // ✅ Logout: clear session dari backend
  const logout = async () => {
    try {
      await api.post("/auth/logout"); // harus ada endpoint logout
    } catch (err) {
      console.error("Gagal logout:", err);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
