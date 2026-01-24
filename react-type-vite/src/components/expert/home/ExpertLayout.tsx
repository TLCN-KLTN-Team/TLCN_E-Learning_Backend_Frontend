import type React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import ExpertSidebar from "./ExpertSidebar";
import AdminHeader from "../../admin/home/AdminHeader"; // Reuse Header for now as it's mostly generic profile/notifs

const ExpertLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    console.log("ExpertLayout rendering...");

    return (
        <div className="admin-container flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <ExpertSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
                {/* Header reuse */}
                <AdminHeader
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                {/* Dynamic Page Content */}
                <div className="p-4 md:p-6 lg:pl-10 lg:pt-4">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default ExpertLayout;
