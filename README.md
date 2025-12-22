# 🎓 NỀN TẢNG HỌC TẬP SỐ KẾT NỐI TRI THỨC VÀ THƯƠNG MẠI HÓA KHÓA HỌC "OPENEDU"

Hệ thống nền tảng học tập trực tuyến toàn diện, được xây dựng dựa trên các công nghệ mới và kiến trúc Microservices hiện đại. Mục tiêu là cung cấp nền tảng cho phép học viên tiếp cận với đa dạng khóa học từ nhiều đơn vị giáo dục uy tín, cũng như sử dụng các tính năng có tính tương tác thời gian thực.

---

## 📋 Mục lục

- [📝 Giới thiệu](#-giới-thiệu)
- [🎯 Tính năng chính](#-tính-năng-chính)
- [👥 Đối tượng người dùng](#-đối-tượng-người-dùng)
- [🏗️ Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
  - [Frontend - React TypeScript Application](#frontend---react-typescript-application)
  - [Backend - Spring Boot Microservices](#backend---spring-boot-microservices)
- [🚀 Quick Start](#-quick-start)
  - [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
  - [Khởi chạy Backend](#khởi-chạy-backend)
  - [Khởi chạy Frontend](#khởi-chạy-frontend)
- [🛠️ Tech Stack](#️-tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [📦 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🔐 Bảo mật](#-bảo-mật)
- [🤝 Đóng góp](#-đóng-góp)
- [📄 License](#-license)
- [📞 Liên hệ](#-liên-hệ)

---

## 📝 Giới thiệu

E-Learning Platform là một hệ thống quản lý học tập (LMS - Learning Management System) đầy đủ tính năng, được thiết kế để phục vụ các tổ chức giáo dục, giảng viên, và học viên. Hệ thống cung cấp một nền tảng tích hợp hoàn chỉnh cho việc tạo, quản lý và tiêu thụ nội dung học tập trực tuyến.

### 📸 Screenshots

![Dashboard](/screenshots/image.png)
![Dashboard](/screenshots/image-2.png)
![Dashboard](/screenshots/image-1.png)
![Dashboard](/screenshots/image-4.png)
![Dashboard](/screenshots/image-3.png)

---

## 🎯 Tính năng chính

- **Quản lý khóa học toàn diện**: Tạo, tổ chức và phân phối nội dung giáo dục
- **Hệ thống đa vai trò**: Dashboard riêng biệt cho System Admin, University, Teacher, User, và Student
- **Chat thời gian thực**: WebSocket-based messaging system
- **Tích hợp thanh toán**: Hỗ trợ VNPay và PayPal
- **Biên tập nội dung phong phú**: TinyMCE editor cho việc tạo nội dung
- **Theo dõi tiến độ**: Analytics và báo cáo chi tiết
- **Tìm kiếm nâng cao**: Elasticsearch integration
- **Quản lý file đa phương tiện**: Tích hợp Cloudinary
- Và nhiều tính năng khác...

---

## 👥 Đối tượng người dùng

- **System Admin**: Quản lý toàn bộ hệ thống
- **University**: Quản lý các tổ chức giáo dục
- **Teacher/Instructor**: Tạo và quản lý khóa học
- **User**: Người dùng có thể mua và truy cập khóa học
- **Student**: Học viên theo dõi tiến độ và hoàn thành khóa học

---

## 🏗️ Kiến trúc hệ thống

Dự án được chia thành 2 phần chính:

### Frontend - React TypeScript Application

- **Framework**: React 19 + TypeScript 5.8 + Vite 7
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **State Management**: React Context + Axios
- **Real-time**: WebSocket (STOMP.js)

📖 **[Xem chi tiết Frontend README](./react-type-vite/README.md)**

### Backend - Spring Boot Microservices

- **Architecture**: Microservices với Spring Cloud
- **API Gateway**: Spring Cloud Gateway (Port 8888)
- **Core Services**:
  - Identity Service (8080) - Authentication & User Management
  - Course Service (8088) - Course & Content Management
  - File Service (8084) - File Storage & Processing
  - Chat Service (8090) - Real-time Messaging
- **Databases**: MySQL, MongoDB, Redis
- **Message Queue**: Kafka + Zookeeper
- **Search**: Elasticsearch

📖 **[Xem chi tiết Backend README](./spring-microservices/README.md)**

---

## 🚀 Quick Start

### Yêu cầu hệ thống

- **Node.js**: v18 hoặc cao hơn
- **Java**: JDK 17 hoặc cao hơn
- **Docker**: Phiên bản mới nhất (khuyến nghị)
- **Maven**: 3.8+
- **MySQL**: 8.0+
- **MongoDB**: 5.0+
- **Redis**: 6.2+

### Khởi chạy Backend

```bash
cd spring-microservices

# Sử dụng Docker Compose (khuyến nghị)
docker-compose up -d

# Hoặc build và chạy thủ công từng service
./build-local.sh
```

### Khởi chạy Frontend

```bash
cd react-type-vite

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

Truy cập ứng dụng tại: `http://localhost:5173`

---

## 🛠️ Tech Stack

### Frontend

- React, TypeScript, Vite
- Tailwind CSS, shadcn/ui, Radix UI
- React Router, Axios
- TinyMCE, Recharts
- WebSocket (STOMP.js)
- Use VSCode with recommended extensions for best experience

### Backend

- Spring Boot, Spring Cloud
- Spring Security, JWT
- MySQL, MongoDB, Redis
- Kafka, Elasticsearch
- Docker, Docker Compose
- Use IntelliJ IDEA with recommended plugins for best experience

---

## 📦 Cấu trúc thư mục

```
TLCN_E-Learning/
├── react-type-vite/          # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # Context providers
│   │   └── hooks/           # Custom hooks
│   └── docs/                # Frontend documentation
│
├── spring-microservices/     # Backend services
│   ├── api-gateway/         # API Gateway service
│   ├── identity-service/    # Authentication service
│   ├── course-service/      # Course management
│   ├── file-service/        # File storage
│   └── chat-service/        # Real-time chat
│
└── README.md                # This file
```

---

## 🔐 Bảo mật

- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing (BCrypt)
- HTTPS enforcement
- CORS configuration
- Rate limiting via API Gateway

---

## 🤝 Đóng góp

Dự án này là một phần của Đồ án Tốt nghiệp (TLCN+KLTN). Mọi đóng góp và góp ý xin vui lòng liên hệ với team phát triển.

---

## 📄 License

[Thêm thông tin license của bạn ở đây]

---

## 📞 Liên hệ

> Liên hệ qua email: [hieu01bdvn@gmail.com]

---

**Built with ❤️ by TLCN Team**
