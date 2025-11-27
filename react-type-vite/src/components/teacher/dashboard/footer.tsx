import type React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 p-3 mt-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Widget */}
          <div className="text-center md:text-left mb-3 md:mb-0 md:w-1/3">
            <Link to="/">
              <img
                className="h-5"
                src="/placeholder.svg?height=20&width=120"
                alt="logo"
              />
            </Link>
          </div>

          {/* Widget */}
          <div className="mb-3 md:mb-0 md:w-1/3">
            <div className="text-center text-white">
              Copyrights ©2024 OpenEdu. Build by{" "}
              <a
                href="https://www.stackbros.in/"
                target="_blank"
                className="text-white hover:text-blue-400"
                rel="noreferrer"
              >
                StackBros
              </a>
              .
            </div>
          </div>

          {/* Widget */}
          <div className="md:w-1/3">
            <ul className="flex justify-center md:justify-end space-x-2 mb-0">
              <li>
                <a
                  href="#"
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
