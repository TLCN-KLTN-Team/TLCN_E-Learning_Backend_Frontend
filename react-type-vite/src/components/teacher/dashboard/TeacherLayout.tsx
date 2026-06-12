"use client"

import type React from "react"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "./sidebar"
import Header from "./header"

const TeacherLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-border z-50 transition-all duration-300 ease-in-out shadow-xl lg:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${sidebarCollapsed ? "lg:w-16" : "lg:w-56"}
        w-56
      `}
      >
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div
        className={`
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-56"}
        ml-0
      `}
      >
        {/* Header */}
        <Header isSidebarOpen={sidebarOpen} setIsSidebarOpen={setSidebarOpen} />

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout
