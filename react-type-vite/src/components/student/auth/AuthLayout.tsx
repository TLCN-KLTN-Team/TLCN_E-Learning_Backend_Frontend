import welcome from "../../../assets/images/element/02.svg";
import ava1 from "../../../assets/images/avatar/01.jpg";
import ava2 from "../../../assets/images/avatar/02.jpg";
import ava3 from "../../../assets/images/avatar/03.jpg";
import ava4 from "../../../assets/images/avatar/04.jpg";
import { useTheme } from "@/context/theme-context";

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
      <div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6 lg:px-12 py-6 lg:py-8 relative"
        style={{
          backgroundImage: `url(${welcome})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40"></div>

        {/* Centered Register Form with better padding */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          {/* Form with enhanced padding */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 lg:p-8">
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <div className="text-2xl mb-1">👋</div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                {title}
              </h2>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
            <div className="max-w-3xl mx-auto">{children}</div>
          </div>
        </div>
      </div>
    );
  }

  // Default login layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex px-4 lg:px-8 py-8">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center p-8 lg:p-12 ml-4 rounded-2xl shadow-lg">
        <div className="max-w-lg text-center space-y-8">
          {/* Welcome Text at Top */}
          <div className="space-y-4">
            <h1 className="heading-1 text-gray-800">
              Welcome to our educational ecosystem!
            </h1>
            <p className="body-large text-gray-600">
              Let's learn something new today!
            </p>
          </div>

          {/* Illustration/Welcome Image */}
          <div className="w-full max-w-md mx-auto">
            {illustration || (
              <img
                src={welcome}
                alt="Welcome to our community"
                className="w-full h-auto object-contain"
              />
            )}
          </div>

          {/* Student avatars at bottom */}
          <div className="flex items-center justify-center space-x-3 pt-4">
            <div className="flex -space-x-2">
              <img
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                src={ava1}
                alt="Student 1"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                src={ava2}
                alt="Student 2"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                src={ava3}
                alt="Student 3"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                src={ava4}
                alt="Student 4"
              />
            </div>
            <p className="body-small text-gray-600 ml-3">
              4k+ Students joined us, now it's your turn.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form with better centering */}
      <div className="flex-1 flex items-center justify-center px-4 lg:px-8 mr-6">
        <div className="w-full max-w-md lg:max-w-lg space-y-4">
          {/* Form with enhanced styling */}
          <div className="bg-white rounded-xl shadow-xl p-6 lg:p-8">
            {/* Header */}
            <div className="text-center space-y-3 mb-8">
              <div className="text-3xl mb-2">👋</div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {title}
              </h2>
              <p className="text-sm lg:text-base text-gray-600">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
