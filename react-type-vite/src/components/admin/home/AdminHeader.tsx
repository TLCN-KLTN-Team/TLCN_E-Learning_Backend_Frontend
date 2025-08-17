"use client"

import type React from "react"
import { useState } from "react"

const AdminHeader: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [theme, setTheme] = useState("auto")

  return (
    <nav className="bg-white border-b border-gray-200 py-3">
      <div className="container-fluid px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Mobile logo and sidebar toggle */}
          <div className="flex items-center">
            <div className="flex items-center xl:hidden">
              <img src="/placeholder.svg?height=30&width=100&text=Eduport" alt="Eduport" className="h-8 mr-4" />
            </div>

            {/* Sidebar toggle */}
            <div className="xl:block">
              <button className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none" type="button">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <input
                type="search"
                placeholder="Search"
                className="w-full pl-4 pr-12 py-2 bg-gray-100 bg-opacity-60 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-transparent border-0 p-2">
                <i className="fas fa-search text-blue-600"></i>
              </button>
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <i className="fas fa-bell text-gray-600"></i>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-4 border-b bg-transparent">
                    <div className="flex justify-between items-center">
                      <h6 className="font-semibold m-0">
                        Notifications{" "}
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">2 new</span>
                      </h6>
                      <button className="text-sm text-blue-600 hover:underline">Clear all</button>
                    </div>
                  </div>
                  <div className="p-0">
                    <ul className="list-none">
                      {/* Notification items */}
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=JW"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <p className="text-sm m-0">
                              Congratulate <strong>Joan Wallace</strong> for graduating from{" "}
                              <strong>Microverse university</strong>
                            </p>
                            <span className="text-xs text-blue-600 underline">Say congrats</span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=LL"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">Larry Lawson Added a new course</h6>
                            <p className="text-xs text-gray-600 m-0">What's new! Find out about new features</p>
                            <span className="text-xs text-blue-600 underline">View detail</span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=NR"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">New request to apply for Instructor</h6>
                            <span className="text-xs text-blue-600 underline">View detail</span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=UP"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">Update v2.3 completed successfully</h6>
                            <p className="text-xs text-gray-600 m-0">What's new! Find out about new features</p>
                            <small className="text-gray-600">5 min ago</small>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 text-center border-t bg-transparent relative">
                    <button className="text-blue-600 hover:underline">See all incoming activity</button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full overflow-hidden p-0"
              >
                <img
                  src="/placeholder.svg?height=40&width=40&text=LF"
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="p-3">
                    <div className="flex items-center">
                      <div className="mr-3 mb-3">
                        <img
                          src="/placeholder.svg?height=40&width=40&text=LF"
                          alt="Profile"
                          className="w-10 h-10 rounded-full shadow"
                        />
                      </div>
                      <div>
                        <h6 className="font-semibold mt-2">Lori Ferguson</h6>
                        <p className="text-sm text-gray-600 m-0">example@gmail.com</p>
                      </div>
                    </div>
                  </div>
                  <hr className="my-0" />
                  <div className="py-0">
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                      <i className="fas fa-user w-4 h-4 mr-2"></i>
                      Edit Profile
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                      <i className="fas fa-cog w-4 h-4 mr-2"></i>
                      Account Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center">
                      <i className="fas fa-info-circle w-4 h-4 mr-2"></i>
                      Help
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center">
                      <i className="fas fa-power-off w-4 h-4 mr-2"></i>
                      Sign Out
                    </button>
                  </div>
                  <hr className="my-0" />
                  {/* Dark mode options */}
                  <div className="p-2">
                    <div className="bg-gray-100 rounded-lg p-1 flex items-center mt-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={`btn btn-sm mb-0 flex items-center justify-center px-2 py-1 rounded text-xs ${
                          theme === "light" ? "bg-white shadow" : ""
                        }`}
                      >
                        <i className="fas fa-sun mr-1"></i> Light
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`btn btn-sm mb-0 flex items-center justify-center px-2 py-1 rounded text-xs ${
                          theme === "dark" ? "bg-white shadow" : ""
                        }`}
                      >
                        <i className="fas fa-moon mr-1"></i> Dark
                      </button>
                      <button
                        onClick={() => setTheme("auto")}
                        className={`btn btn-sm mb-0 flex items-center justify-center px-2 py-1 rounded text-xs ${
                          theme === "auto" ? "bg-white shadow active" : ""
                        }`}
                      >
                        <i className="fas fa-circle-half-stroke mr-1"></i> Auto
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default AdminHeader
