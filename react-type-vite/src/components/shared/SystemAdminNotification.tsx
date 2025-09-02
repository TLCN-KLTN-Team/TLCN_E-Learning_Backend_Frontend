import { BellRing } from "lucide-react";

const SystemAdminNotification = () => {
  return (
    <div className="max-w-md bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h6 className="font-semibold text-gray-800 m-0 flex items-center">
            <BellRing />
            System Notifications
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
              3 new
            </span>
          </h6>
          <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
            Mark all read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        <ul className="list-none divide-y divide-gray-100">
          {/* System Update Notification */}
          <li>
            <div className="p-4 hover:bg-blue-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">
                    System Update v2.4.1 Available
                  </h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Critical security patches and performance improvements
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                      View update details
                    </span>
                    <small className="text-gray-500">2 hours ago</small>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Server Maintenance Notification */}
          <li>
            <div className="p-4 hover:bg-yellow-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">
                    Scheduled Maintenance Notice
                  </h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Server maintenance scheduled for Sept 15, 2025 from 2:00 AM
                    - 4:00 AM
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                      View maintenance details
                    </span>
                    <small className="text-gray-500">1 day ago</small>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Security Alert */}
          <li>
            <div className="p-4 hover:bg-red-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">
                    Security Alert: Suspicious Activity Detected
                  </h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Multiple failed login attempts detected from IP:
                    192.168.1.100
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                      Review security logs
                    </span>
                    <small className="text-gray-500">30 minutes ago</small>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* Database Backup Complete */}
          <li>
            <div className="p-4 hover:bg-green-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">
                    Daily Database Backup Completed
                  </h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Automatic backup completed successfully at 03:00 AM
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                      View backup status
                    </span>
                    <small className="text-gray-500">6 hours ago</small>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* System Performance Alert */}
          <li>
            <div className="p-4 hover:bg-orange-50 transition-colors cursor-pointer">
              <div className="flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h6 className="text-sm font-semibold text-gray-900 mb-1">
                    High CPU Usage Detected
                  </h6>
                  <p className="text-xs text-gray-600 mb-2">
                    Server CPU usage exceeded 85% threshold for 15 minutes
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                      View performance metrics
                    </span>
                    <small className="text-gray-500">1 hour ago</small>
                  </div>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 rounded-b-lg text-center">
        <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
          View all system notifications
        </button>
      </div>
    </div>
  );
};

export default SystemAdminNotification;
