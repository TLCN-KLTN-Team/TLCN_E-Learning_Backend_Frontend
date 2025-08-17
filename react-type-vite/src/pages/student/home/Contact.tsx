import { useState } from "react";
import Footer from "@/components/student/home/Footer";
import Header from "@/components/student/home/Header";
import { useTheme } from "@/context/theme-context/useTheme";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  User,
  MessageSquare,
} from "lucide-react";

import map from "@/assets/images/element/map.svg";
import contact from "@/assets/images/element/contact.svg";

const Contact = () => {
  const { resolvedTheme } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission here
    alert("Message sent successfully!");
  };

  return (
    <div className={`min-h-screen p-12 lg:p-16`}>
      <Header />

      {/* Hero Section with Map Background */}
      <section
        className="p-12 lg:p-16 mt-8 lg:mt-16 relative"
        style={{
          backgroundImage: `url(${map})`,
          backgroundPosition: "center left",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Overlay for better text readability */}
        <div
          className={`absolute inset-0 ${
            resolvedTheme === "dark" ? "bg-slate-900/70" : "bg-white/70"
          }`}
        ></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-center">
            <div className="lg:w-8/12 xl:w-6/12 text-center">
              <h6 className="text-blue-500 font-semibold mb-2">Contact us</h6>
              <h1
                className={`text-4xl font-bold mb-4 ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                We're here to help!
              </h1>
            </div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-8 mt-0 lg:mt-12 pb-16">
            {/* Customer Support */}
            <div className="lg:mt-0">
              <div className="bg-blue-600 text-white shadow-lg rounded-lg p-8 text-center h-full">
                <h5 className="text-xl font-semibold mb-6">Customer Support</h5>
                <ul className="space-y-4">
                  <li>
                    <a href="#" className="flex text-white no-underline">
                      <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>
                        HCMC UTE. Số 1, Võ Văn Ngân, Linh Chiểu, Thủ Đức
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+14237338222"
                      className="flex items-center justify-center text-white no-underline"
                    >
                      <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>...</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:example@email.com"
                      className="flex items-center justify-center text-white no-underline"
                    >
                      <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>example@email.com</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Address */}
            <div className="lg:mt-0">
              <div
                className={`shadow-lg rounded-lg p-8 text-center h-full ${
                  resolvedTheme === "dark"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-900"
                }`}
              >
                <h5 className="text-xl font-semibold mb-6">Contact Address</h5>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="#"
                      className={`flex no-underline ${
                        resolvedTheme === "dark"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>
                        HCMC UTE. Số 1, Võ Văn Ngân, Linh Chiểu, Thủ Đức
                      </span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+896789546"
                      className={`flex items-center justify-center no-underline ${
                        resolvedTheme === "dark"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>+896-789-546</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:example@email.com"
                      className={`flex items-center justify-center no-underline ${
                        resolvedTheme === "dark"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>example@email.com</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Main Office Address */}
            <div className="lg:mt-0">
              <div
                className={`shadow-lg rounded-lg p-8 text-center h-full ${
                  resolvedTheme === "dark"
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-900"
                }`}
              >
                <h5 className="text-xl font-semibold mb-6">
                  Email contact creator
                </h5>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="tel:+16783241251"
                      className={`flex items-center justify-center no-underline ${
                        resolvedTheme === "dark"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>0879884636</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:example@email.com"
                      className={`flex items-center justify-center no-underline ${
                        resolvedTheme === "dark"
                          ? "text-slate-300"
                          : "text-slate-600"
                      }`}
                    >
                      <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span>hieu01bdvn@gmail.com</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-0 items-center">
            {/* Left Column - Image and Social Media */}
            <div className="text-center">
              <img
                src={contact}
                alt="Contact illustration"
                className="h-96 mx-auto mb-8"
              />

              {/* Social Media */}
              <div className="flex flex-col sm:flex-row items-center justify-center mt-4">
                <h5
                  className={`mb-2 sm:mb-0 sm:mr-4 ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  Follow us on:
                </h5>
                <div className="flex space-x-3">
                  <a href="#" className="text-blue-600 text-xl no-underline">
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-pink-600 text-xl no-underline">
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-blue-400 text-xl no-underline">
                    <Twitter className="w-6 h-6" />
                  </a>
                  <a href="#" className="text-blue-700 text-xl no-underline">
                    <Linkedin className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="md:pl-8">
              <h2
                className={`text-3xl font-bold mt-4 md:mt-0 mb-4 ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Let's talk
              </h2>
              <p
                className={`mb-6 ${
                  resolvedTheme === "dark" ? "text-slate-300" : "text-slate-600"
                }`}
              >
                To request a quote or want to meet up for coffee, contact us
                directly or fill out the form and we will get back to you
                promptly
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Input */}
                <div>
                  <label
                    htmlFor="name"
                    className={`block text-sm font-medium mb-2 ${
                      resolvedTheme === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Your name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        resolvedTheme === "dark"
                          ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label
                    htmlFor="email"
                    className={`block text-sm font-medium mb-2 ${
                      resolvedTheme === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Email address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        resolvedTheme === "dark"
                          ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <label
                    htmlFor="message"
                    className={`block text-sm font-medium mb-2 ${
                      resolvedTheme === "dark"
                        ? "text-slate-300"
                        : "text-slate-700"
                    }`}
                  >
                    Message *
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-slate-400" />
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        resolvedTheme === "dark"
                          ? "bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                          : "bg-slate-50 border-slate-300 text-slate-900"
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
