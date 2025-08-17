"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { useTheme } from "../../../context/theme-context/useTheme"
import { Button } from "@/components/ui/button"
import { NavLink } from "react-router-dom";
import { Sun, Moon, Monitor, Search, User, Settings, HelpCircle, LogOut, Menu, ChevronDown } from "lucide-react"

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const renderThemeToggle = () => (
    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mt-2 flex gap-1">
      <button
        type="button"
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          theme === "light"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        onClick={() => setTheme("light")}
      >
        <Sun className="w-4 h-4 inline mr-1" /> Light
      </button>
      <button
        type="button"
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          theme === "dark"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        onClick={() => setTheme("dark")}
      >
        <Moon className="w-4 h-4 inline mr-1" /> Dark
      </button>
      <button
        type="button"
        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
          theme === "system"
            ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
        onClick={() => setTheme("system")}
      >
        <Monitor className="w-4 h-4 inline mr-1" /> Auto
      </button>
    </div>
  )

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center max-w-[120px] lg:max-w-[150px] decoration-none no-hover-effect"
          >
            <img
              src={
                theme === "dark"
                  ? "/src/assets/images/logo-light.svg"
                  : "/src/assets/images/logo.svg"
              }
              alt="E-Learning Platform"
              className="h-6 lg:h-8 w-fit"
            />
          </NavLink>

          {/* Navigation Menu - Hidden on mobile */}
          <div className="hidden xl:flex items-center space-x-8">
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-[#066ac9] font-medium transition-colors duration-300">
                <span>Demos</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/"
                  >
                    Home Default
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/education"
                  >
                    Home Education
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/academy"
                  >
                    Home Academy
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/course"
                  >
                    Home Course
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/university"
                  >
                    Home University
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-[#066ac9] font-medium transition-colors duration-300">
                <span>Pages</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</div>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/course-categories"
                  >
                    Course Categories
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/course-grid"
                  >
                    Course Grid Classic
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/course-detail"
                  >
                    Course Detail
                  </Link>
                  <hr className="my-2 border-gray-200 dark:border-gray-600" />
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">About</div>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/about"
                  >
                    About Us
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/contact"
                  >
                    Contact Us
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/pricing"
                  >
                    Pricing
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-[#066ac9] font-medium transition-colors duration-300">
                <span>Accounts</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Instructor
                  </div>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/teacher/home"
                  >
                    Dashboard
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/teacher/courses"
                  >
                    Courses
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/teacher/create-course"
                  >
                    Create Course
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/teacher/earnings"
                  >
                    Earnings
                  </Link>
                  <hr className="my-2 border-gray-200 dark:border-gray-600" />
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</div>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/student/dashboard"
                  >
                    Dashboard
                  </Link>
                  <Link
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/student/courses"
                  >
                    My Courses
                  </Link>
                </div>
              </div>
            </div>

            <Link
              className="text-gray-600 hover:text-[#066ac9] font-medium transition-colors duration-300"
              to="/components"
            >
              Components
            </Link>

            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-600 hover:text-[#066ac9] font-medium transition-colors duration-300">
                <span>•••</span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/support"
                  >
                    <HelpCircle className="w-4 h-4 mr-3 text-yellow-500" />
                    Support
                  </Link>
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    to="/docs"
                  >
                    <Settings className="w-4 h-4 mr-3 text-red-500" />
                    Documentation
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#066ac9] focus:border-transparent transition-all duration-300"
                type="search"
                placeholder="Search"
                aria-label="Search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="xl:hidden">
              <Menu className="w-5 h-5" />
            </Button>

            <div className="relative group">
              <button className="flex items-center p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <img
                  className="w-8 h-8 rounded-full border-2 border-white shadow"
                  src="/placeholder.svg?height=32&width=32"
                  alt="avatar"
                />
              </button>

              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <img
                      className="w-10 h-10 rounded-full shadow"
                      src="/placeholder.svg?height=40&width=40"
                      alt="avatar"
                    />
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">Lori Ferguson</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">example@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    to="/teacher/edit-profile"
                  >
                    <User className="w-4 h-4 mr-3" />
                    Edit Profile
                  </Link>
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    to="/teacher/settings"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Account Settings
                  </Link>
                  <Link
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    to="/help"
                  >
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Help
                  </Link>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 p-3">{renderThemeToggle()}</div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
