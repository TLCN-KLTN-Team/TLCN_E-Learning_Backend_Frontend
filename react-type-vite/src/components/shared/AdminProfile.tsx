import { Info, LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import { useState } from "react";

const AdminProfile = () => {
  const [theme, setTheme] = useState("auto");

  const buttonStyles =
    "w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 flex items-center";

  return (
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
            <h6 className="font-semibold text-gray-900 mt-2">Lori Ferguson</h6>
            <p className="text-sm text-gray-600 m-0">example@gmail.com</p>
          </div>
        </div>
      </div>
      <hr className="my-0" />
      <div className="py-0">
        <button className={buttonStyles}>
          <User className="w-4 h-4 mr-2" />
          Edit Profile
        </button>
        <button className={buttonStyles}>
          <Settings className="w-4 h-4 mr-2" />
          Account Settings
        </button>
        <button className={buttonStyles}>
          <Info className="w-4 h-4 mr-2" />
          Help
        </button>
        <button className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center">
          <LogOut className="w-4 h-4 mr-2" />
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
            <Sun className="w-3 h-3 mr-1" /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`btn btn-sm mb-0 flex items-center justify-center px-2 py-1 rounded text-xs ${
              theme === "dark" ? "bg-white shadow" : ""
            }`}
          >
            <Moon className="w-3 h-3 mr-1" /> Dark
          </button>
          <button
            onClick={() => setTheme("auto")}
            className={`btn btn-sm mb-0 flex items-center justify-center px-2 py-1 rounded text-xs ${
              theme === "auto" ? "bg-white shadow active" : ""
            }`}
          >
            <Monitor className="w-3 h-3 mr-1" /> Auto
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
