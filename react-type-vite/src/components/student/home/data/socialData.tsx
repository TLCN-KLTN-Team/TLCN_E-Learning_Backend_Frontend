import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export const socialLinks = [
  {
    name: "Facebook",
    href: "#",
    icon: (
      <Facebook
        size={20}
        className="text-blue-600 group-hover:scale-110 transition-transform"
      />
    ),
  },
  {
    name: "Instagram",
    href: "#",
    icon: (
      <Instagram
        size={20}
        className="text-pink-500 group-hover:scale-110 transition-transform"
      />
    ),
  },
  {
    name: "Twitter",
    href: "#",
    icon: (
      <Twitter
        size={20}
        className="text-blue-400 group-hover:scale-110 transition-transform"
      />
    ),
  },
  {
    name: "LinkedIn",
    href: "#",
    icon: (
      <Linkedin
        size={20}
        className="text-blue-700 group-hover:scale-110 transition-transform"
      />
    ),
  },
];
