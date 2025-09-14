import { HandHeart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 px-8 flex flex-col justify-center items-center">
      <span className="flex items-center gap-1 text-sm mb-2">
        Made by Devzeus with
        <HandHeart className="h-5 w-5 text-red-500" />
      </span>
      <p className="text-sm">
        &copy; 2025 E-Learning Platform. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
