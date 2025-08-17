import type React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutGrid,
  ShoppingBasket,
  HelpCircle,
  TrendingUp,
  Users,
  FolderCheck,
  Star,
  Edit,
  Wallet,
  Settings,
  Trash2,
  LogOut,
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", icon: LayoutGrid, path: "/teacher/home" },
  { name: "My Courses", icon: ShoppingBasket, path: "/teacher/courses" },
  { name: "Quiz", icon: HelpCircle, path: "/teacher/quiz" },
  { name: "Earnings", icon: TrendingUp, path: "/teacher/earnings" },
  { name: "Students", icon: Users, path: "/teacher/students" },
  { name: "Orders", icon: FolderCheck, path: "/teacher/orders" },
  { name: "Reviews", icon: Star, path: "/teacher/reviews" },
  { name: "Edit Profile", icon: Edit, path: "/teacher/edit-profile" },
  { name: "Payouts", icon: Wallet, path: "/teacher/payouts" },
  { name: "Settings", icon: Settings, path: "/teacher/settings" },
  { name: "Delete Profile", icon: Trash2, path: "/teacher/delete-profile" },
]

const Sidebar: React.FC = () => {
  const location = useLocation()

  return (
    <div className="xl:block">
      {/* Responsive offcanvas body START */}
      <div className="offcanvas-xl offcanvas-end" tabIndex={-1} id="offcanvasSidebar">
        {/* Offcanvas header */}
        <div className="offcanvas-header bg-gray-100 dark:bg-gray-800 xl:hidden p-4">
          <h5 className="text-lg font-semibold">My profile</h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            data-bs-target="#offcanvasSidebar"
            aria-label="Close"
          ></button>
        </div>
        {/* Offcanvas body */}
        <div className="p-3 xl:p-0">
          <div className="bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg p-3 w-full">
            {/* Dashboard menu */}
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname === item.path
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-700"
                  }`}
                  to={item.path}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              ))}
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-md transition-colors">
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Responsive offcanvas body END */}
    </div>
  )
}

export default Sidebar
