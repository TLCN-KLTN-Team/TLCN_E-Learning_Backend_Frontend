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

const techStack = [
  {
    label: "Frontend",
    icon: Code2,
    iconClass: "text-primary",
    items: [
      "React 19",
      "TypeScript 5.8",
      "Vite 7",
      "Tailwind CSS 4",
      "shadcn/ui",
      "WebSocket (STOMP.js)",
    ],
  },
  {
    label: "Backend",
    icon: Server,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    items: [
      "Spring Boot",
      "Spring Cloud",
      "Spring Security",
      "JWT",
      "Microservices",
    ],
  },
  {
    label: "Database",
    icon: Database,
    iconClass: "text-violet-600 dark:text-violet-400",
    items: ["MySQL 8.0+", "MongoDB 5.0+", "Redis 6.2+", "Elasticsearch"],
  },
  {
    label: "DevOps",
    icon: Layers,
    iconClass: "text-accent",
    items: ["Docker", "Kafka", "Zookeeper", "API Gateway"],
  },
];

// Gradient nền cho hero/contact — cố định (không phụ thuộc theme) để chữ trắng
// luôn đủ tương phản ở cả Light và Dark mode.
const bannerGradient =
  "bg-gradient-to-br from-[hsl(172_66%_26%)] via-[hsl(172_66%_22%)] to-[hsl(172_72%_15%)]";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12">
        {/* Hero Section */}
        <section className={`${bannerGradient} text-white py-16`}>
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block mb-4">
              <span className="bg-white/15 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium ring-1 ring-white/25">
                Tiểu luận chuyên ngành
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hệ thống E-Learning
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto mb-8">
              Nền tảng học trực tuyến toàn diện với kiến trúc Microservices hiện
              đại, hỗ trợ đa vai trò người dùng và tích hợp nhiều tính năng nâng
              cao.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-white/25">
                TypeScript 65.5%
              </span>
              <span className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-white/25">
                Java 33.1%
              </span>
              <span className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium ring-1 ring-white/25">
                CSS 1.1%
              </span>
            </div>
            <a
              href="https://github.com/TLCN-KLTN-Team/TLCN_E-Learning_Backend_Frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[hsl(172_66%_24%)] px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              <Github className="h-5 w-5" />
              Xem trên GitHub
            </a>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Thành viên nhóm
              </h2>
              <p className="text-muted-foreground">Đội ngũ phát triển dự án</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member) => (
                <Card
                  key={member.mssv}
                  className="bg-card border border-border hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center">
                      <Avatar className="h-32 w-32 mb-4 ring-4 ring-primary/15">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                          {member.name.split(" ").slice(-1)[0].charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        {member.name}
                      </h3>
                      <span className="inline-block bg-primary/10 text-primary px-4 py-1 rounded-full text-sm font-mono font-semibold mb-3">
                        MSSV: {member.mssv}
                      </span>
                      <p className="text-muted-foreground mb-6">
                        {member.role}
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={member.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg transition-colors"
                        >
                          <Github className="h-4 w-4" />
                          GitHub
                        </a>
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg transition-colors"
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
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Giảng viên hướng dẫn
              </h2>
            </div>

            <Card className="max-w-md mx-auto bg-card border-2 border-accent/30">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 mb-4 ring-4 ring-accent/25">
                    <AvatarFallback className="text-2xl font-bold bg-accent/15 text-accent">
                      MAT
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {instructor.name}
                  </h3>
                  <p className="text-accent font-semibold mb-1">
                    {instructor.role}
                  </p>
                  <p className="text-muted-foreground">
                    {instructor.department}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Tính năng chính
              </h2>
              <p className="text-muted-foreground">
                Các tính năng nổi bật của hệ thống
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectFeatures.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-card border border-border hover:shadow-md hover:border-primary/30 transition-all hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Công nghệ sử dụng
              </h2>
              <p className="text-muted-foreground">Tech Stack của dự án</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {techStack.map((group) => (
                <Card
                  key={group.label}
                  className="bg-card border border-border hover:shadow-md transition-all"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                      <group.icon className={`h-5 w-5 ${group.iconClass}`} />
                      {group.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full border border-border"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Kiến trúc hệ thống
              </h2>
              <p className="text-muted-foreground">Microservices Architecture</p>
            </div>

            <Card className="max-w-4xl mx-auto bg-card border border-border">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      Core Services
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                          8080
                        </span>
                        <span>Identity Service - Authentication</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                          8088
                        </span>
                        <span>Course Service - Course Management</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                          8084
                        </span>
                        <span>File Service - Storage</span>
                      </li>
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                          8090
                        </span>
                        <span>Chat Service - Real-time Messaging</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-accent" />
                      API Gateway
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="px-3 py-1 bg-accent/15 text-accent rounded font-mono font-semibold">
                          8888
                        </span>
                        <span>Spring Cloud Gateway</span>
                      </li>
                      <li className="text-sm text-muted-foreground">
                        • Rate limiting
                      </li>
                      <li className="text-sm text-muted-foreground">
                        • CORS configuration
                      </li>
                      <li className="text-sm text-muted-foreground">
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
        <section className={`${bannerGradient} text-white py-16`}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Liên hệ</h2>
            <p className="text-white/85 text-lg mb-8 max-w-2xl mx-auto">
              Mọi đóng góp và góp ý xin vui lòng liên hệ với team phát triển
            </p>
            <a
              href="mailto:hieu01bdvn@gmail.com"
              className="inline-flex items-center gap-2 bg-white text-[hsl(172_66%_24%)] px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-colors text-lg"
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
