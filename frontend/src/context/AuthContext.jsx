import { createContext, useContext, useMemo, useState } from "react";
import http from "../api/http";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  });

  const login = async (values) => {
    const { data } = await http.post("/auth/login", values);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await http.get("/auth/profile");
    const nextUser = { ...user, ...data };
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(
    () => ({ isAdmin: user?.role === "admin", login, logout, refreshProfile, user }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
