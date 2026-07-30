import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLayout from "./pages/admin/AdminLayout";
import ContractManagementPage from "./pages/admin/ContractManagementPage";
import InvoiceManagementPage from "./pages/admin/InvoiceManagementPage";
import OperatingExpenseManagementPage from "./pages/admin/OperatingExpenseManagementPage";
import RepairRequestManagementPage from "./pages/admin/RepairRequestManagementPage";
import RoomManagementPage from "./pages/admin/RoomManagementPage";
import TenantManagementPage from "./pages/admin/TenantManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UserHomePage from "./pages/user/UserHomePage";
import UserRoomDetailPage from "./pages/user/UserRoomDetailPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="contracts" element={<ContractManagementPage />} />
        <Route path="invoices" element={<InvoiceManagementPage />} />
        <Route path="operating-expenses" element={<OperatingExpenseManagementPage />} />
        <Route path="repair-requests" element={<RepairRequestManagementPage />} />
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
      <Route
        path="/user/rooms/:id"
        element={
          <ProtectedRoute>
            <UserRoomDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
