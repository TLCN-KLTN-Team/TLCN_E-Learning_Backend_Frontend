import { useTheme } from "../../../context/theme-context";
import lightLogo from "@/assets/open-edu-light.png";
import darkLogo from "@/assets/open-edu-dark.png";

import { footerSections } from "@/components/student/home/data/footerData";
import { socialLinks } from "@/components/student/home/data/socialData";

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer className="bg-muted/50 border-t border-border py-8 lg:py-12">
      <div className="px-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <img
                src={theme === "light" ? darkLogo : lightLogo}
                alt="E-Learning Platform"
                className="max-h-[200px] w-auto mb-4"
              />
              <p className="text-muted-foreground text-sm leading-relaxed">
                Nền tảng học trực tuyến hàng đầu, cung cấp các khóa học chất
                lượng cao với chứng chỉ được công nhận quốc tế.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-8">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-muted-foreground hover:text-bs-primary transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="px-6 lg:px-10">
              <h3 className="font-semibold text-foreground mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-bs-primary transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h4 className="font-semibold text-foreground mb-2">
                Đăng ký nhận tin tức mới nhất
              </h4>
              <p className="text-muted-foreground text-sm">
                Nhận thông báo về các khóa học mới và ưu đãi đặc biệt
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="px-4 py-2 border border-border rounded-lg text-foreground placeholder:text-muted-foreground flex-1 lg:w-64"
              />
              <button className="bg-bs-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors whitespace-nowrap">
                Đăng ký
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 E-Learning Platform. Built with ❤️ by Devzeus.</p>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-bs-primary transition-colors">
                Chính sách bảo mật
              </a>
              <a href="#" className="hover:text-bs-primary transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="#" className="hover:text-bs-primary transition-colors">
                Cookie
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
