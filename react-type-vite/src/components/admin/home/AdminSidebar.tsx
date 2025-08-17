"use client"

import type React from "react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

const AdminSidebar: React.FC = () => {
  const location = useLocation()
  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const [isInstructorsOpen, setIsInstructorsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <ul className="p-4 space-y-1">
          <li className="mb-8">
            <Link to="/admin" className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">e</span>
                </div>
                <span className="text-xl font-bold text-white">Eduport</span>
              </div>
            </Link>
          </li>
          {/* Dashboard */}
          <li>
            <Link
              to="/admin"
              className={`flex items-center px-3 py-3 rounded transition-colors ${
                isActive("/admin")
                  ? "bg-blue-600 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5v-4h2v4a.5.5 0 0 0 .5.5H14a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146zM2.5 14V7.707l5.5-5.5 5.5 5.5V14H10v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4H2.5z" />
              </svg>
              Dashboard
            </Link>
          </li>

          {/* Courses */}
          <li>
            <button
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
              className="w-full flex items-center justify-between px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.757 1.071a.5.5 0 0 1 .172.686L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v4.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 13.5V9a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h1.217L4.07 1.243a.5.5 0 0 1 .686-.172zM2 9v4.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V9H2zM3 8.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm8 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z" />
                </svg>
                Courses
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isCoursesOpen ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isCoursesOpen && (
              <ul className="ml-8 mt-2 space-y-1">
                <li>
                  <Link
                    to="/admin/courses"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    All Courses
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/course-category"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Course Category
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/course-detail"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Course Detail
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Students */}
          <li>
            <Link
              to="/admin/students"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              Students
            </Link>
          </li>

          {/* Instructors */}
          <li>
            <button
              onClick={() => setIsInstructorsOpen(!isInstructorsOpen)}
              className="w-full flex items-center justify-between px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                </svg>
                Instructors
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isInstructorsOpen ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isInstructorsOpen && (
              <ul className="ml-8 mt-2 space-y-1">
                <li>
                  <Link
                    to="/admin/instructors"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Instructors
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/instructor-detail"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Instructor Detail
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/instructor-requests"
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Instructor requests
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      2
                    </span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Reviews */}
          <li>
            <Link
              to="/admin/reviews"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 512 512">
                <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm128 0a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm128 0a32 32 0 1 1 0-64 32 32 0 1 1 0 64z" />
              </svg>
              Reviews
            </Link>
          </li>

          {/* Earnings */}
          <li>
            <Link
              to="/admin/earnings"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 512 512">
                <path d="M32 32C14.3 32 0 46.3 0 64v336c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V64c0-17.7-14.3-32-32-32zm96 128c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32v224c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V160zM320 192c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32v160c0 17.7-14.3 32-32 32H352c-17.7 0-32-14.3-32-32V192zM256 304c0-17.7 14.3-32 32-32h32c17.7 0 32 14.3 32 32v48c0 17.7-14.3 32-32 32H288c-17.7 0-32-14.3-32-32V304z" />
              </svg>
              Earnings
            </Link>
          </li>

          {/* Admin Settings */}
          <li>
            <Link
              to="/admin/settings"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 640 512">
                <path d="M224 256A128 128 0 1 1 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H322.8c-3.1-8.8-3.7-18.4-1.4-27.8l15-60.1c2.8-11.3 8.6-21.5 16.8-29.7l40.3-40.3c-32.1-31-75.7-50.1-123.9-50.1H178.3zm435.5-68.3c-15.7-15.7-40.9-15.7-56.6 0L586.3 251.6c-6.3 6.3-10.1 14.9-10.1 23.8s3.8 17.6 10.1 23.8l15.9 15.9c6.3 6.3 14.9 10.1 23.8 10.1s17.6-3.8 23.8-10.1l15.9-15.9c15.7-15.7 15.7-40.9 0-56.6L613.8 187.7z" />
              </svg>
              Admin Settings
            </Link>
          </li>

          {/* Authentication */}
          <li>
            <button
              onClick={() => setIsAuthOpen(!isAuthOpen)}
              className="w-full flex items-center justify-between px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" />
                </svg>
                Authentication
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isAuthOpen ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {isAuthOpen && (
              <ul className="ml-8 mt-2 space-y-1">
                <li>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/forgot-password"
                    className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Forgot Password
                  </Link>
                </li>
                <li>
                  <Link to="/404" className="block px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                    Error 404
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Documentation */}
          <li>
            <Link
              to="/admin/docs"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 384 512">
                <path d="M280 64h40c35.3 0 64 28.7 64 64v320c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16v320c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
              </svg>
              Documentation
            </Link>
          </li>

          {/* Changelog */}
          <li className="mb-8">
            <Link
              to="/admin/changelog"
              className="flex items-center px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="currentColor" viewBox="0 0 576 512">
                <path d="M208 80c0-26.5 21.5-48 48-48h64c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48h-8v40H464c30.9 0 56 25.1 56 56v32h8c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48H464c-26.5 0-48-21.5-48-48V368c0-26.5 21.5-48 48-48h8V288c0-4.4-3.6-8-8-8h112v40H464c-26.5 0-48-21.5-48-48V368c0-26.5 21.5-48 48-48h8V280H112c-4.4 0-8 3.6-8 8v32h8c26.5 0 48 21.5 48 48v64c0 26.5-21.5 48-48 48H256c-26.5 0-48-21.5-48-48V368c0-26.5 21.5-48 48-48h8V288c0-30.9 25.1-56 56-56H264V192h-8c-26.5 0-48-21.5-48-48V80z" />
              </svg>
              Changelog
            </Link>
          </li>

          {/* Footer */}
          <li>
            <div className="px-4 pb-4">
              <div className="flex justify-between items-center mb-3">
                <Link
                  to="/admin/settings"
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105-.872l.1-.34c.413-1.4 2.397-1.4 2.81 0l.1.34a1.464 1.464 0 0 1 2.105.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                  </svg>
                </Link>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors" title="Home">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM2.04 4.326c.325 1.329 2.532 2.54 3.717 3.19.48.263.793.434.743.484-.08.08-.162.158-.242.234-.416.396-.787.749-.758 1.266.035.634.618.824 1.214 1.017.577.188 1.168.38 1.286.983.082.417-.075.988-.22 1.52-.215.782-.406 1.48.22 1.48 1.5-.5 3.798-3.186 4-5 .138-1.243-2-2-3.5-2.5-.478-.16-.755.081-.99.284-.172.15-.322.279-.51.216-.445-.148-2.5-2-1.5-2.5-.78-.746-1.409-.864-1.639-.9-.114-.018-.22-.023-.324-.027z" />
                  </svg>
                </Link>
                <Link to="/login" className="text-gray-400 hover:text-white transition-colors" title="Sign out">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1v6h7a7 7 0 0 1-7 8z" />
                  </svg>
                </Link>
              </div>
              
            </div>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default AdminSidebar
