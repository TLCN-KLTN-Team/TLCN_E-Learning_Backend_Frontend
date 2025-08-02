import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import logo from "@/assets/images/logo.svg";
import logoLight from "@/assets/images/logo-light.svg";

interface FooterProps {
  isDarkMode: boolean;
}

const Footer = ({ isDarkMode }: FooterProps) => {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log("Newsletter subscription submitted");
  };

  return (
    <footer className="px-20 bg-white dark:bg-[#24292d] border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Logo and Newsletter */}
          <div className="lg:col-span-5">
            <a href="#" className="inline-block mb-6">
              <img
                src={isDarkMode ? logoLight : logo}
                alt="Eduport"
                className="h-5 w-auto"
              />
            </a>
            <p className="text-[#747579] dark:text-gray-300 mb-6 text-sm leading-relaxed">
              Eduport education theme, built specifically for the education
              centers which is dedicated to teaching and involve learners.
            </p>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center text-[#747579] dark:text-gray-300 text-sm">
                <Mail size={16} className="mr-3 text-[#066ac9]" />
                <span>hieu01bdvn@gmail.com</span>
              </div>
              <div className="flex items-center text-[#747579] dark:text-gray-300 text-sm">
                <Phone size={16} className="mr-3 text-[#066ac9]" />
                <span>+84 123456789</span>
              </div>
              <div className="flex items-center text-[#747579] dark:text-gray-300 text-sm">
                <MapPin size={16} className="mr-3 text-[#066ac9]" />
                <span>Số 1-3 Võ Văn Ngân, Linh Trung, Thủ Đức</span>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <h6 className="font-semibold text-[#24292d] dark:text-white mb-4 text-sm">
                Newsletter
              </h6>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 text-sm h-12 text-white border-white hover:text-black hover:bg-black-100 dark:hover:bg-gray-200 transition-colors"
                  required
                />
                <Button
                  type="submit"
                  className="bg-[#066ac9] dark:bg-[#066ac9] text-white hover:bg-[#0555a1] dark:hover:bg-[#0555a1] transition-colors text-sm px-6 py-3 h-12"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>

          {/* Footer Links */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h6 className="font-semibold text-[#24292d] dark:text-white mb-4">
                  Quick Links
                </h6>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Contact us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Sitemap
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h6 className="font-semibold text-[#24292d] dark:text-white mb-4">
                  Services
                </h6>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Become instructor
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Download
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] transition-colors"
                    >
                      Services
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h6 className="font-semibold text-[#24292d] dark:text-white mb-4">
                  Follow Us
                </h6>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center group transition-colors"
                    >
                      <Facebook
                        size={18}
                        className="mr-3 text-blue-600 group-hover:scale-110 transition-transform"
                      />
                      <span>Facebook</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 flex items-center group transition-colors"
                    >
                      <Instagram
                        size={18}
                        className="mr-3 text-pink-500 group-hover:scale-110 transition-transform"
                      />
                      <span>Instagram</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-blue-400 dark:hover:text-blue-300 flex items-center group transition-colors"
                    >
                      <Twitter
                        size={18}
                        className="mr-3 text-blue-400 group-hover:scale-110 transition-transform"
                      />
                      <span>Twitter</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-[#747579] dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-500 flex items-center group transition-colors"
                    >
                      <Linkedin
                        size={18}
                        className="mr-3 text-blue-700 group-hover:scale-110 transition-transform"
                      />
                      <span>LinkedIn</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-600" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="text-[#747579] dark:text-gray-300 mb-4 md:mb-0">
            <span>Copyrights ©2025 OpenEdu. Built with ❤️ by Devzeus </span>
            <a
              href="#"
              className="text-[#066ac9] dark:text-[#066ac9] hover:text-[#0555a1] dark:hover:text-[#0555a1] font-medium transition-colors hover:underline"
            >
              StackBros
            </a>
            <span>.</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end space-x-6">
            <a
              href="#"
              className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] text-sm transition-colors hover:underline"
            >
              Terms of use
            </a>
            <a
              href="#"
              className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] text-sm transition-colors hover:underline"
            >
              Privacy policy
            </a>
            <a
              href="#"
              className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] text-sm transition-colors hover:underline"
            >
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
