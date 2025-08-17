import type React from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Star, Users, BookOpen, CheckCircle } from "lucide-react"

const ProfileBanner: React.FC = () => {
  return (
    <section className="pt-0">
      {/* Main banner background image */}
      <div className="w-full px-0">
        <div
          className="bg-[#066ac9] h-24 md:h-48 w-full rounded-none relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #066ac9 0%, #0555a1 100%), url(/placeholder.svg?height=200&width=1200&query=geometric+pattern)",
            backgroundSize: "cover, 100px 100px",
            backgroundPosition: "center, center",
            backgroundBlendMode: "overlay",
          }}
        >
          {/* Decorative pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px)",
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Profile banner START */}
          <div className="w-full">
            <div className="bg-transparent p-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 md:mt-0">
                  <div className="relative -mt-3">
                    <img
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                      src="/src/assets/images/avatar/01.jpg?height=96&width=96"
                      alt="Teacher Profile"
                    />
                  </div>
                  {/* Profile info */}
                  <div className="mt-4">
                    <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2 mb-1 text-gray-800">
                      Lori Stevens
                      <CheckCircle className="w-5 h-5 text-[#066ac9]" />
                    </h1>
                    <ul className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#f7c32e]" />
                        <span className="font-light">4.5/5.0</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-[#fd7e14]" />
                        <span className="font-light">12k Enrolled Students</span>
                      </li>
                      <li className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-[#6f42c1]" />
                        <span className="font-light">25 Courses</span>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Button */}
                <div className="flex items-center mt-2 md:mt-0">
                  <Button
                    asChild
                    className="bg-[#0cbc87] hover:bg-[#08845f] text-white transition-all duration-300 hover:-translate-y-0.5 shadow-md"
                  >
                    <Link to="/teacher/create-course">Create a course</Link>
                  </Button>
                </div>
              </div>
            </div>
            {/* Profile banner END */}

            {/* Advanced filter responsive toggler START */}
            <hr className="block xl:hidden my-4 border-gray-200 dark:border-gray-700" />
            <div className="flex xl:hidden justify-between items-center">
              <h6 className="text-lg font-bold">Menu</h6>
              <button
                className="px-4 py-2 bg-[#066ac9] text-white rounded-md hover:bg-[#0555a1] transition-colors duration-300"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar"
              >
                <i className="fas fa-sliders-h"></i>
              </button>
            </div>
            {/* Advanced filter responsive toggler END */}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProfileBanner
