import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import BuildingManagementPage from "./pages/admin/BuildingManagementPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLayout from "./pages/admin/AdminLayout";
import MeterReadingManagementPage from "./pages/admin/MeterReadingManagementPage";
import RoomManagementPage from "./pages/admin/RoomManagementPage";
import TenantManagementPage from "./pages/admin/TenantManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import LoginPage from "./pages/auth/LoginPage";
import UserHomePage from "./pages/user/UserHomePage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="buildings" element={<BuildingManagementPage />} />
        <Route path="meter-readings" element={<MeterReadingManagementPage />} />
        <Route path="rooms" element={<RoomManagementPage />} />
        <Route path="tenants" element={<TenantManagementPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserHomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
