import welcome from "../../../assets/images/element/02.svg";
import ava1 from "../../../assets/images/avatar/01.jpg";
import ava2 from "../../../assets/images/avatar/02.jpg";
import ava3 from "../../../assets/images/avatar/03.jpg";
import ava4 from "../../../assets/images/avatar/04.jpg";
import uteLogo from "../../../assets/images/logo/ute-logo.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  illustration?: React.ReactNode;
}

const AuthLayout = ({
  children,
  title,
  subtitle,
  illustration,
}: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center p-12">
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

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="text-4xl mb-2">👋</div>
            <h2 className="heading-2 text-gray-900">{title}</h2>
            <p className="body-base text-gray-600">{subtitle}</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div
              onClick={() => (window.location.href = "/")}
              className="text-center mb-4 cursor-pointer"
            >
              <img
                src={uteLogo}
                alt="University Logo"
                className="w-24 h-24 mx-auto mb-4 rounded border-2 border-gray-200 shadow-sm"
              />
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
