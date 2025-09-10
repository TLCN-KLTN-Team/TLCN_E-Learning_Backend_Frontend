"use client"

import type React from "react"
import { Link, useLocation } from "react-router-dom"
import {
  LayoutGrid,
  BookOpen,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", icon: LayoutGrid, path: "/teacher/home" },
  { name: "Khóa Học Được Gán", icon: BookOpen, path: "/teacher/assigned-courses" },
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

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation()

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src="/src/assets/images/logo.svg" alt="E-Learning Platform" className="h-8 w-auto" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 p-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 group ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
              to={item.path}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={`w-4 h-4 ${collapsed ? "mx-auto" : "mr-3"}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}

          <button
            className={`flex items-center w-full px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-all duration-200 group`}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className={`w-4 h-4 ${collapsed ? "mx-auto" : "mr-3"}`} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
