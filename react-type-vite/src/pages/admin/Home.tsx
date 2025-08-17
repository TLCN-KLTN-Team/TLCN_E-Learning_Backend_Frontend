import type React from "react"
import AdminSidebar from "../../components/admin/home/AdminSidebar"
import AdminHeader from "../../components/admin/home/AdminHeader"
import AdminStatsCards from "../../components/admin/home/AdminStatsCards"
import AdminEarningsChart from "../../components/admin/home/AdminEarningsChart"
import AdminSupportRequests from "../../components/admin/home/AdminSupportRequests"
import AdminTopInstructors from "../../components/admin/home/AdminTopInstructors"
import AdminNoticeBoard from "../../components/admin/home/AdminNoticeBoard"
import AdminTrafficSources from "../../components/admin/home/AdminTrafficSources"

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-65 pl-6">
        {/* Header */}
        <AdminHeader />

        {/* Page Content */}
        <div className="p-1">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Stats Cards */}
          <AdminStatsCards />

          {/* Chart and Support Requests */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <AdminEarningsChart />
            </div>
            <div className="xl:col-span-1">
              <AdminSupportRequests />
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AdminTopInstructors />
            <AdminNoticeBoard />
            <AdminTrafficSources />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
