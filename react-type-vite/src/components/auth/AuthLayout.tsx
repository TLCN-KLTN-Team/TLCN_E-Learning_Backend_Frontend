import { motion } from "framer-motion";
import { useTheme } from "@/context/theme-context";

import authLogo from "@/assets/Login_logo.png";
import { NavLink } from "react-router-dom";
import AuthHero from "./AuthHero";
import AuthBackdrop from "./AuthBackdrop";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  illustration?: React.ReactNode;
  isRegister?: boolean;
}

const AuthLayout = ({
  children,
  title,
  subtitle,
  illustration,
  isRegister = false,
}: AuthLayoutProps) => {
  const theme = useTheme();
  theme.setTheme("light");

  // Register layout with background image and centered form
  if (isRegister) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-6 lg:px-12 py-6 lg:py-8 relative">
        {/* Nền trang trí động */}
        <AuthBackdrop />

        {/* Centered Register Form with better padding */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl"
        >
          {/* Form with enhanced padding */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 p-6 lg:p-9">
            {/* Header với logo và welcome message */}
            <div className="text-center space-y-4 mb-6">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex justify-center mb-4"
              >
                <NavLink
                  to="/"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-50 p-2.5 ring-1 ring-blue-100 hover:cursor-pointer transition-shadow hover:shadow-md"
                >
                  <img
                    src={authLogo}
                    alt="OpenEdu Logo"
                    className="w-10 h-10 object-contain"
                  />
                </NavLink>
              </motion.div>

              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {title}
                </h2>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </motion.div>
            </div>
            <div className="max-w-3xl">{children}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Default login layout
  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex px-4 lg:px-8 py-8">
      {/* Left Side - Animated Hero */}
      {illustration ? (
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-8 lg:p-12 ml-4 rounded-3xl bg-slate-50 ring-1 ring-slate-200/70">
          <div className="w-full max-w-md mx-auto">{illustration}</div>
        </div>
      ) : (
        <AuthHero />
      )}

      {/* Right Side - Form with better centering */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-8 mr-6">
        <div className="w-full max-w-md lg:max-w-lg space-y-4">
          {/* Form with enhanced styling */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 p-6 lg:p-9">
            {/* Header với logo và welcome message */}
            <div className="text-center space-y-4 mb-8">
              {/* Logo */}
              <div className="flex justify-center hover:cursor-pointer">
                <NavLink to="/">
                  <img
                    src={authLogo}
                    alt="OpenEdu Logo"
                    className="w-12 h-12 object-contain"
                  />
                </NavLink>
              </div>

              {/* Welcome Message */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{subtitle}</p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
