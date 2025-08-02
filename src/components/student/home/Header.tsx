import { useState, useEffect } from "react";
import { useTheme } from "../../../context/theme-context";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { NavLink } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Trang chủ", href: "#home" },
    { name: "Khóa học", href: "#courses" },
    { name: "Về chúng tôi", href: "#about" },
    { name: "Liên hệ", href: "#contact" },
  ];

  // const homeNavigation = [
  //   {name: "Trang dạy học số"},
  //   {name: "Trang giáo viên"},
  //   {name: "Trang Admin"},
  // ];

  return (
    <header
      className={`px-12 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm shadow-bs border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center max-w-[120px] lg:max-w-[150px]">
            <img
              src={
                theme === "dark"
                  ? "/src/assets/images/logo-light.svg"
                  : "/src/assets/images/logo.svg"
              }
              alt="E-Learning Platform"
              className="h-6 lg:h-8 w-fit no-hover-effect"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-bs-primary transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            <NavLink
              to="/login"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:text-bs-primary transition-colors font-medium no-hover-effect"
            >
              Đăng nhập
            </NavLink>
            <NavLink
              to="/register"
              className="bg-bs-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors no-hover-effect"
            >
              Đăng ký
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-bs-primary transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border">
            <nav className="py-4 space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-foreground hover:text-bs-primary hover:bg-muted transition-colors font-medium rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="border-t border-border pt-4 mt-4 px-4 space-y-2">
                <NavLink
                  to="/login"
                  className="block w-full text-left py-2 text-foreground hover:text-bs-primary transition-colors font-medium no-hover-effect"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/register"
                  className="block w-full bg-bs-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors text-center no-hover-effect"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Đăng ký
                </NavLink>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
