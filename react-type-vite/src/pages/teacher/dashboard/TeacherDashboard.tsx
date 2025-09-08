import type React from "react"
import ProfileBanner from "../../../components/teacher/dashboard/profile-banner"
import StatsCards from "../../../components/teacher/dashboard/stats-cards"
import EarningsChart from "../../../components/teacher/dashboard/earnings-chart"
import CoursesTable from "../../../components/teacher/dashboard/courses-table"
import Footer from "../../../components/teacher/dashboard/footer"

const TeacherDashboard: React.FC = () => {
  return (
    <div className="flex-1 overflow-auto">
      <ProfileBanner />
      <section className="pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <StatsCards />
            <EarningsChart />
            <CoursesTable />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default TeacherDashboard
