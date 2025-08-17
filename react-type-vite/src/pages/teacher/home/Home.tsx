import type React from "react"
import Header from "../../../components/teacher/dashboard/header"
import ProfileBanner from "../../../components/teacher/dashboard/profile-banner"
import Sidebar from "../../../components/teacher/dashboard/sidebar"
import StatsCards from "../../../components/teacher/dashboard/stats-cards"
import EarningsChart from "../../../components/teacher/dashboard/earnings-chart"
import CoursesTable from "../../../components/teacher/dashboard/courses-table"
import Footer from "../../../components/teacher/dashboard/footer"

const TeacherDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ProfileBanner />
        <section className="pt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col xl:flex-row gap-6">
              <div className="xl:w-1/4">
                <Sidebar />
              </div>
              <div className="xl:w-3/4">
                <StatsCards />
                <EarningsChart />
                <CoursesTable />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default TeacherDashboard
