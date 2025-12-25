import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Github,
  Mail,
  Users,
  BookOpen,
  Code2,
  Database,
  Server,
  MessageSquare,
  CreditCard,
  Search,
  Shield,
  Layers,
} from "lucide-react";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

const teamMembers = [
  {
    name: "Trần Trung Hiếu",
    mssv: "22110139",
    role: "Full-stack Developer",
    avatar: "https://avatars.githubusercontent.com/u/127457628?s=400&v=4",
    github: "https://github.com/Hieu-with-love",
    email: "hieu01bdvn@gmail.com",
  },
  {
    name: "Hoàng Phi Hiệp",
    mssv: "22110140",
    role: "Full-stack Developer",
    avatar: "https://avatars.githubusercontent.com/u/110793780?s=400&v=4",
    github: "https://github.com/hoangphihiep",
  },
];

const instructor = {
  name: "TS. Mai Anh Thơ",
  role: "Giảng viên hướng dẫn",
  department: "Khoa Công nghệ Thông tin",
};

const projectFeatures = [
  {
    icon: BookOpen,
    title: "Quản lý khóa học toàn diện",
    desc: "Tạo, tổ chức và phân phối nội dung giáo dục",
  },
  {
    icon: Users,
    title: "Hệ thống đa vai trò",
    desc: "Dashboard riêng biệt cho Admin, University, Teacher, User, Student",
  },
  {
    icon: MessageSquare,
    title: "Chat thời gian thực",
    desc: "WebSocket-based messaging system",
  },
  {
    icon: CreditCard,
    title: "Tích hợp thanh toán",
    desc: "Hỗ trợ VNPay và PayPal",
  },
  {
    icon: Search,
    title: "Tìm kiếm nâng cao",
    desc: "Elasticsearch integration",
  },
  {
    icon: Shield,
    title: "Bảo mật",
    desc: "JWT, RBAC, BCrypt, HTTPS",
  },
];

const techStack = {
  frontend: [
    "React 19",
    "TypeScript 5.8",
    "Vite 7",
    "Tailwind CSS 4",
    "shadcn/ui",
    "WebSocket (STOMP.js)",
  ],
  backend: [
    "Spring Boot",
    "Spring Cloud",
    "Spring Security",
    "JWT",
    "Microservices",
  ],
  database: ["MySQL 8.0+", "MongoDB 5.0+", "Redis 6.2+", "Elasticsearch"],
  devops: ["Docker", "Kafka", "Zookeeper", "API Gateway"],
};

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 pb-12">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium">
                Tiểu luận chuyên ngành
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hệ thống E-Learning
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Nền tảng học trực tuyến toàn diện với kiến trúc Microservices hiện
              đại, hỗ trợ đa vai trò người dùng và tích hợp nhiều tính năng nâng
              cao.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                TypeScript 65.5%
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                Java 33.1%
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                CSS 1.1%
              </span>
            </div>
            <a
              href="https://github.com/TLCN-KLTN-Team/TLCN_E-Learning_Backend_Frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Github className="h-5 w-5" />
              Xem trên GitHub
            </a>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Thành viên nhóm
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Đội ngũ phát triển dự án
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member) => (
                <Card
                  key={member.mssv}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-32 w-32 mb-4 ring-4 ring-blue-100 dark:ring-blue-900">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-3xl font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          {member.name.split(" ").slice(-1)[0].charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {member.name}
                      </h3>
                      <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-1 rounded-full text-sm font-mono font-semibold mb-3">
                        MSSV: {member.mssv}
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {member.role}
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                        >
                          <Github className="h-4 w-4" />
                          GitHub
                        </a>
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Giảng viên hướng dẫn
              </h2>
            </div>

            <Card className="max-w-md mx-auto bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border-2 border-amber-200 dark:border-amber-900">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 mb-4 ring-4 ring-amber-200 dark:ring-amber-900">
                    <AvatarFallback className="text-2xl font-bold bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200">
                      MAT
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {instructor.name}
                  </h3>
                  <p className="text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    {instructor.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {instructor.department}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Tính năng chính
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Các tính năng nổi bật của hệ thống
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="h-14 w-14 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                      <feature.icon className="h-7 w-7 text-blue-600 dark:text-blue-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Công nghệ sử dụng
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tech Stack của dự án
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                    <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    Frontend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {techStack.frontend.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 border-2 border-green-200 dark:border-green-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                    <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Backend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {techStack.backend.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 border-2 border-purple-200 dark:border-purple-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                    <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {techStack.database.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-700 border-2 border-orange-200 dark:border-orange-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                    <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    DevOps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {techStack.devops.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs rounded-full border border-gray-200 dark:border-gray-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Kiến trúc hệ thống
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Microservices Architecture
              </p>
            </div>

            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Core Services
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded font-mono font-semibold">
                          8080
                        </span>
                        <span>Identity Service - Authentication</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded font-mono font-semibold">
                          8088
                        </span>
                        <span>Course Service - Course Management</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded font-mono font-semibold">
                          8084
                        </span>
                        <span>File Service - Storage</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded font-mono font-semibold">
                          8090
                        </span>
                        <span>Chat Service - Real-time Messaging</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-green-600 dark:text-green-400" />
                      API Gateway
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded font-mono font-semibold">
                          8888
                        </span>
                        <span>Spring Cloud Gateway</span>
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        • Rate limiting
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        • CORS configuration
                      </li>
                      <li className="text-sm text-gray-700 dark:text-gray-300">
                        • Request routing
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Liên hệ</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Mọi đóng góp và góp ý xin vui lòng liên hệ với team phát triển
            </p>
            <a
              href="mailto:hieu01bdvn@gmail.com"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              <Mail className="h-5 w-5" />
              hieu01bdvn@gmail.com
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
