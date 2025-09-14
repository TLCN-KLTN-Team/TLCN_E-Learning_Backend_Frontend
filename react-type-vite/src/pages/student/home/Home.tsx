"use client"
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HeroSection from "../../../components/student/home/HeroSection";
import SubjectsSection from "../../../components/student/home/SubjectsSection";
import TestimonialsSlider from "../../../components/student/home/TestimonialsSlider";
import BackToTop from "../../../components/ui/BackToTop";
import Header from "../../../components/student/home/Header";
import Footer from "../../../components/student/home/Footer";
import EducationalUnitLinked from "@/components/student/home/EducationalUnitLinked";

// Import animated components
import {
  AnimatedSection,
  FadeInUp,
  FadeInLeft,
  FadeInRight,
  StaggerContainer,
} from "@/motion";
import { HoverScale, AnimatedButton } from "@/motion";

// Import link hover effects for homepage
import "../../../styles/link-hover-effects.css";

// Import images
import element06 from "@/assets/images/element/06.svg";
import element07 from "@/assets/images/element/07.svg";
import element08 from "@/assets/images/element/08.svg";
import element09 from "@/assets/images/element/09.svg";
import element10 from "@/assets/images/element/10.svg";
import googlePlayIcon from "@/assets/images/client/google-play.svg";
import appStoreIcon from "@/assets/images/client/app-store.svg";
import avatar01 from "@/assets/images/avatar/01.jpg";
import avatar05 from "@/assets/images/avatar/05.jpg";
import avatar07 from "@/assets/images/avatar/07.jpg";
import avatar09 from "@/assets/images/avatar/09.jpg";
import { useNavigate } from "react-router-dom"

const Home = () => {
  // Sample data for subjects section
  const navigate = useNavigate()
  const subjects = [
    {
      id: "it",
      name: "Công nghệ thông tin",
      image: "/src/assets/images/courses/01.jpg",
      icon: "/src/assets/images/client/angular.svg",
      description:
        "Khám phá thế giới công nghệ với các khóa học lập trình, phát triển web, mobile app và nhiều hơn nữa.",
      courseCount: 25,
    },
    {
      id: "business",
      name: "Kinh doanh",
      image: "/src/assets/images/courses/02.jpg",
      icon: "/src/assets/images/client/graduated.svg",
      description:
        "Phát triển kỹ năng kinh doanh, quản lý và khởi nghiệp với các chuyên gia hàng đầu.",
      courseCount: 18,
    },
    {
      id: "design",
      name: "Thiết kế",
      image: "/src/assets/images/courses/03.jpg",
      icon: "/src/assets/images/client/figma.svg",
      description:
        "Học thiết kế đồ họa, UI/UX và các công cụ thiết kế chuyên nghiệp.",
      courseCount: 12,
    },
  ];

  const testimonials = [
    {
      avatar: avatar05,
      name: "Lori Stevens",
      content:
        "Moonlight newspaper up its enjoyment agreeable depending. Timed voice share led him to widen. At weddings believed laughing",
    },
    {
      avatar: avatar07,
      name: "Billy Vasquez",
      content:
        "Its enjoyment Moonlight newspaper up agreeable depending. Timed voice share led him to widen. At weddings believed laughing",
    },
    {
      avatar: avatar09,
      name: "Carolyn Ortiz",
      content:
        "Newspaper up its enjoyment agreeable depending. Timed voice share led him to widen. At weddings believed laughing",
    },
    {
      avatar: avatar01,
      name: "Carolyn Ortiz",
      content:
        "Newspaper up its enjoyment agreeable depending. Timed voice share led him to widen. At weddings believed laughing",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground homepage-links">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-16 lg:pt-20">
        {/* Hero Section */}
        <HeroSection />

        {/* About Section */}
        <AnimatedSection className="py-12 lg:py-16 px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <FadeInLeft className="relative">
                {/* Background decoration */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -ml-8 hidden sm:block z-0">
                  <svg
                    width="625.8px"
                    height="550px"
                    viewBox="0 0 625.8 630.8"
                    className="fill-bs-primary opacity-20"
                  >
                    <path d="M445.8,133.5c59.7,50.3,122.9,96,149.7,161c26.5,64.6,15.9,148.6-29.9,197.7C520.3,541,439,555,364.9,578.1 c-74.5,23.1-142.1,55.2-200.4,42.3S57.2,549.7,32.6,487.3c-24.2-62-24.2-128.9-17.8-199.6C21.7,217,34.5,142.6,78.7,89.6 S198.6,5,264.4,16.7S386.1,83.2,445.8,133.5z" />
                  </svg>
                </div>
                <img
                  src={element06}
                  alt="About illustration"
                  className="relative z-10 max-w-full h-auto"
                />
              </FadeInLeft>

              <FadeInRight>
                <StaggerContainer>
                  <FadeInUp delay={0.1}>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      <p>
                        Bạn là học viên tự do. Muốn tìm khóa học chất lượng?
                      </p>
                      <p>Để chúng tôi giúp bạn!</p>
                    </h2>
                  </FadeInUp>

                  <FadeInUp delay={0.2}>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Làm thế nào sự khuyến khích và tính tò mò tuyệt vời lại có
                      thể mang đến hạnh phúc. Những ấn tượng tươi sáng và thịnh
                      vượng đi cùng niềm tin mạnh mẽ. Mỗi sự trì hoãn là một cái
                      chết – hãy thể hiện phong cách của bạn với những kiến thức
                      từ chúng tôi. Tôi – với khả năng và ý chí – sẽ vượt qua
                      cùng những khó khăn trong gian khó.
                    </p>
                  </FadeInUp>

                  <ul className="space-y-3 mb-6">
                    {[
                      "Việc cài đặt và thiết lập mất ít thời gian",
                      "Phần mềm chuyên nghiệp và dễ sử dụng",
                      "Cung cấp nền tảng học số đa dụng và linh hoạt",
                      "Có sẵn các khóa học từ cơ bản đến nâng cao",
                    ].map((item, index) => (
                      <FadeInUp key={index} delay={0.3 + index * 0.1}>
                        <li className="flex items-center space-x-2">
                          <ArrowRight
                            className="text-bs-primary flex-shrink-0"
                            size={16}
                          />
                          <span className="text-muted-foreground text-sm">
                            {item}
                          </span>
                        </li>
                      </FadeInUp>
                    ))}
                  </ul>

                  <FadeInUp delay={0.7}>
                    <AnimatedButton>
                      <Button
                        variant="outline"
                        className="border-bs-primary text-bs-primary hover:bg-bs-primary-subtle text-sm px-6 py-2"
                      >
                        More about us
                      </Button>
                    </AnimatedButton>
                  </FadeInUp>
                </StaggerContainer>
              </FadeInRight>
            </div>
          </div>
        </AnimatedSection>

        {/* Subjects Section */}
        <AnimatedSection>
          <SubjectsSection subjects={subjects} />
        </AnimatedSection>

        {/* Mobile App Section */}
        <AnimatedSection className="py-12 lg:py-16 px-6 lg:px-8 overflow-hidden">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <FadeInLeft className="relative z-10">
                <StaggerContainer>
                  <FadeInUp delay={0.1}>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                      Bạn đang là sinh viên của trường đại học hoặc cao đẳng?
                    </h2>
                  </FadeInUp>

                  <FadeInUp delay={0.2}>
                    <p className="text-muted-foreground mb-6 text-sm">
                      Tại thanh điều hướng, chọn Mục lục "Khóa học" và chọn
                      "Trang học tập số", chọn Trường của bạn (đã được liên kết
                      với chúng tôi) để truy cập vào các khóa học và tài liệu
                      học tập được cung cấp.
                    </p>
                  </FadeInUp>

                  <FadeInUp delay={0.3}>
                    <div className="flex space-x-3">
                      <HoverScale>
                        <a href="#" className="block transition-transform">
                          <img
                            src={googlePlayIcon}
                            alt="Google Play"
                            className="h-10 w-auto"
                          />
                        </a>
                      </HoverScale>
                      <HoverScale>
                        <a href="#" className="block transition-transform">
                          <img
                            src={appStoreIcon}
                            alt="App Store"
                            className="h-10 w-auto"
                          />
                        </a>
                      </HoverScale>
                    </div>
                  </FadeInUp>
                </StaggerContainer>
              </FadeInLeft>

              <FadeInRight className="relative">
                {/* Background decoration */}
                <div className="absolute top-1/2 right-0 transform translate-y-[-50%] translate-x-8 z-0">
                  <svg
                    width="632.6px"
                    height="540.4px"
                    viewBox="0 0 632.6 540.4"
                    className="fill-bs-primary opacity-20"
                  >
                    <path d="M531.4,46.9c46.3,27.4,81.4,79.8,91.1,136.2c9.7,56.8-6.4,117.7-38.3,166s-79.4,84.2-138.6,119.3 c-59.6,35.1-130.6,69.7-201.5,62.1c-70.5-7.7-141.4-57.6-185.4-126.5C14.4,335.5-2.9,247.2,23.7,179.5 c26.2-68.1,96.7-116.5,161.6-140.2c64.9-24.2,124.5-24.6,183.3-23.4C427,17.1,485.1,19.5,531.4,46.9z" />
                  </svg>
                </div>
                <img
                  src={element07}
                  alt="Mobile app illustration"
                  className="relative z-10 max-w-full h-auto"
                />
              </FadeInRight>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA Section */}
        <AnimatedSection className="py-12 lg:py-16 px-6 lg:px-8">
          <div className="container mx-auto">
            <FadeInUp>
              <div className="bg-card border rounded-lg p-6 md:p-8 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 left-0 -ml-7 hidden lg:block z-0">
                  <svg
                    width="294.5px"
                    height="261.6px"
                    viewBox="0 0 294.5 261.6"
                    className="fill-bs-warning opacity-30"
                  >
                    <path d="M280.7,84.9c-4.6-9.5-10.1-18.6-16.4-27.2c-18.4-25.2-44.9-45.3-76-54.2c-31.7-9.1-67.7-0.2-93.1,21.6 C82,36.4,71.9,50.6,65.4,66.3c-4.6,11.1-9.5,22.3-17.2,31.8c-6.8,8.3-15.6,15-22.8,23C10.4,137.6-0.1,157.2,0,179 c0.1,28,11.4,64.6,40.4,76.7c23.9,10,50.7-3.1,75.4-4.7c23.1-1.5,43.1,10.4,65.5,10.6c53.4,0.6,97.8-42,109.7-90.4 C298.5,140.9,293.4,111.5,280.7,84.9z" />
                  </svg>
                </div>

                <img
                  src={element09}
                  alt="CTA decoration"
                  className="absolute bottom-0 right-0 -mr-3 hidden lg:block z-10"
                />

                <div className="relative z-20">
                  <StaggerContainer className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <FadeInUp
                      delay={0.1}
                      className="lg:col-span-3 text-center lg:text-left"
                    >
                      <img
                        src={element08}
                        alt="Course illustration"
                        className="mx-auto lg:mx-0 max-w-full h-auto"
                      />
                    </FadeInUp>

                    <FadeInUp delay={0.2} className="lg:col-span-6 text-center">
                      <h6 className="text-sm font-light text-muted-foreground mb-2">
                        Đơn vị giáo dục của bạn cần nền tảng học tập số để cung
                        cấp cho sinh viên?
                      </h6>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        Chúng tôi cung cấp giải pháp toàn diện cho các trường
                        đại học và cao đẳng.
                      </h3>
                    </FadeInUp>

                    <FadeInUp delay={0.3} className="lg:col-span-3 text-center">
                      <AnimatedButton>
                        <Button
                          className="bg-amber-600 hover:bg-bs-warning text-white px-6 py-2 text-sm"
                          onClick={() => navigate("/register-training-unit")}
                        >
                          Đăng ký đơn vị của bạn tại đây
                        </Button>
                      </AnimatedButton>
                    </FadeInUp>
                  </StaggerContainer>
                </div>
              </div>
            </FadeInUp>
          </div>
        </AnimatedSection>

        {/* Educational Unit Linked Section */}
        <AnimatedSection>
          <EducationalUnitLinked />
        </AnimatedSection>

        {/* Testimonials Section */}
        <AnimatedSection className="py-12 lg:py-16 px-6 lg:px-8 bg-muted relative">
          {/* Background decoration */}
          <div className="absolute left-0 bottom-0">
            <img
              src={element10}
              alt="Background decoration"
              className="h-40 opacity-50"
            />
          </div>

          <div className="container mx-auto relative z-10">
            <StaggerContainer className="text-center mb-12">
              <FadeInUp delay={0.1}>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  Phản hồi từ học viên
                </h2>
              </FadeInUp>

              <FadeInUp delay={0.2}>
                <p className="text-muted-foreground">
                  Những phản hồi từ học viên của chúng tôi là nguồn động lực lớn
                  nhất để chúng tôi không ngừng cải thiện và phát triển. Hãy
                  cùng lắng nghe những chia sẻ chân thành từ những người đã trải
                  nghiệm khóa học của chúng tôi.
                </p>
              </FadeInUp>
            </StaggerContainer>

            <FadeInUp delay={0.3}>
              <TestimonialsSlider testimonials={testimonials} />
            </FadeInUp>
          </div>
        </AnimatedSection>
      </main>

      {/* Footer */}
      <Footer />

      {/* Back to Top */}
      <BackToTop />
    </div>
  );
};

export default Home;
