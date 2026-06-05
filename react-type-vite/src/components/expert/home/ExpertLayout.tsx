import type React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import ExpertSidebar from "./ExpertSidebar";
import ExpertHeader from "./ExpertHeader";

const ExpertLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    console.log("ExpertLayout rendering...");

    return (
        <div className="admin-container flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <ExpertSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                collapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? "lg:ml-16" : "lg:ml-72"}`}>
                {/* Expert header */}
                <ExpertHeader
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
