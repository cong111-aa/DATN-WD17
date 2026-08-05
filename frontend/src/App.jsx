import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicHomePage from "./pages/PublicHomePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLayout from "./pages/admin/AdminLayout";
import ContractManagementPage from "./pages/admin/ContractManagementPage";
import InvoiceManagementPage from "./pages/admin/InvoiceManagementPage";
import OperatingExpenseManagementPage from "./pages/admin/OperatingExpenseManagementPage";
import RepairRequestManagementPage from "./pages/admin/RepairRequestManagementPage";
import RoomRequestManagementPage from "./pages/admin/RoomRequestManagementPage";
import RoomManagementPage from "./pages/admin/RoomManagementPage";
import TenantManagementPage from "./pages/admin/TenantManagementPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import UserContractsPage from "./pages/user/UserContractsPage";
import UserHomePage from "./pages/user/UserHomePage";
import UserInterestedRoomsPage from "./pages/user/UserInterestedRoomsPage";
import UserInvoicesPage from "./pages/user/UserInvoicesPage";
import UserLayout from "./pages/user/UserLayout";
import UserMyRoomsPage from "./pages/user/UserMyRoomsPage";
import UserProfilePage from "./pages/user/UserProfilePage";
import UserRepairRequestsPage from "./pages/user/UserRepairRequestsPage";
import UserRoomDetailPage from "./pages/user/UserRoomDetailPage";
import UserRoomRequestsPage from "./pages/user/UserRoomRequestsPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicHomePage />} />
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
        <Route path="room-requests" element={<RoomRequestManagementPage />} />
        <Route path="rooms" element={<RoomManagementPage />} />
        <Route path="tenants" element={<TenantManagementPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserHomePage />} />
        <Route path="my-rooms" element={<UserMyRoomsPage />} />
        <Route path="contracts" element={<UserContractsPage />} />
        <Route path="invoices" element={<UserInvoicesPage />} />
        <Route path="repair-requests" element={<UserRepairRequestsPage />} />
        <Route path="room-requests" element={<UserRoomRequestsPage />} />
        <Route path="interested-rooms" element={<UserInterestedRoomsPage />} />
        <Route path="profile" element={<UserProfilePage />} />
      </Route>
      <Route
        path="/rooms/:id"
        element={<UserRoomDetailPage />}
      />
      <Route
        path="/user/rooms/:id"
        element={<UserRoomDetailPage />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
