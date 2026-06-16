import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConfigProvider>
  </React.StrictMode>
);
