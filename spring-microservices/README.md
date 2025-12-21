# E-Learning Platform - Backend Microservices

## 📋 Project Overview

### Backend Objectives

The E-Learning Platform backend is built to provide a comprehensive online learning system with high scalability and easy maintenance. The system supports:

- User management and secure authentication
- Course, lesson, and learning content management
- Real-time chat and interaction system
- Online payment (VNPay, PayPal)
- Fast search with Elasticsearch
- Multimedia file processing and storage

### System Role

- **API Layer**: Provides RESTful APIs for frontend and mobile apps
- **Business Logic**: Handles complex business logic for each domain
- **Data Management**: Manages data with multiple database types (MySQL, MongoDB, Redis)
- **Security**: Ensures authentication, authorization, and data security
- **Integration**: Integrates external services (payment gateway, cloud storage, OAuth)

## 🏗️ Architecture

### Overall Architecture

The system is built using **Microservices Architecture**, which enables:

- Independent development and deployment of each service
- Flexible scaling according to needs
- Easy maintenance and upgrades
- Clear separation of responsibilities

```
┌─────────────┐
│   Clients   │ (Web, Mobile, Desktop)
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │ (Port 8888)
│  - Routing          │
│  - Load Balancing   │
│  - Authentication   │
└──────┬──────────────┘
       │
       ├──────────┬───────────┬───────────┬───────────┐
       ▼          ▼           ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Identity  │ │ Course   │ │   File   │ │   Chat   │ │  Other   │
│ Service  │ │ Service  │ │ Service  │ │ Service  │ │ Services │
│(:8080)   │ │(:8088)   │ │(:8084)   │ │(:8090)   │ │          │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
     │            │            │            │
     └────────────┴────────────┴────────────┘
                  │
     ┌────────────┴────────────┐
     ▼            ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│  MySQL  │ │ MongoDB  │ │  Redis   │
└─────────┘ └──────────┘ └──────────┘

     ┌────────────┬────────────┐
     ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│  Kafka  │ │Elastic   │ │Cloudinary│
│         │ │ search   │ │          │
└─────────┘ └──────────┘ └──────────┘
```

### Main Components

#### 1. API Gateway (Port 8888)

- **Technology**: Spring Cloud Gateway (WebFlux)
- **Functions**:
  - Route requests to appropriate services
  - Load balancing
  - Centralized Authentication & Authorization
  - Rate limiting
  - Request/Response transformation

#### 2. Core Services

Independent microservices handling separate domains

#### 3. Databases

- **MySQL**: Stores relational data (users, courses, enrollments)
- **MongoDB**: Stores unstructured data (files metadata, chat messages)
- **Redis**: Caching and session management

#### 4. Message Queue

- **Kafka + Zookeeper**: Event-driven communication between services

#### 5. Search Engine

- **Elasticsearch**: Full-text search for courses and content
- **Kibana**: Visualize and monitor data

#### 6. External Services

- **Cloudinary**: Cloud storage for images and videos
- **VNPay & PayPal**: Payment gateways
- **OAuth Providers**: Google, Facebook authentication

---

## 🔧 Core Services

### 1. Identity Service (Port 8080)

**Endpoint**: `/identity`

**Responsibilities**:

- User management (registration, login, profile)
- Authentication and authorization (JWT tokens)
- OAuth2 integration (Google, Facebook)
- Roles and permissions management
- Email verification
- Password reset

**Database**: MySQL (`identity_service`)

**Key Technologies**:

- Spring Security
- OAuth2 Resource Server
- JWT (JSON Web Tokens)
- Spring Data JPA
- Redis (token caching)

---

### 2. Course Service (Port 8088)

**Endpoint**: `/course-management`

**Responsibilities**:

- Course management (CRUD operations)
- Lessons, modules, chapters management
- Enrollment management
- Reviews and ratings
- Progress tracking
- Payment processing (VNPay, PayPal)
- Certificate generation
- Course search with Elasticsearch

**Database**: MySQL (`course_management`)

**Key Technologies**:

- Spring Boot Web
- Spring Data JPA
- Elasticsearch integration
- Payment gateway SDKs
- Spring Mail (notifications)

---

### 3. File Service (Port 8084)

**Endpoint**: `/file-handler`

**Responsibilities**:

- Upload/download files
- Image and video processing
- Cloudinary integration
- File metadata management
- Thumbnail generation
- File validation and security

**Database**: MongoDB (`file-handler-service`)

**Key Technologies**:

- Spring Boot Web
- Spring Data MongoDB
- Cloudinary SDK
- Multipart file handling

---

### 4. Chat Service (Port 8090)

**Endpoint**: `/server`

**Responsibilities**:

- Real-time messaging
- WebSocket connections
- Chat rooms and direct messages
- Message history
- File sharing in chat
- Online status tracking
- Notifications

**Database**: MongoDB (`mongo_notification`)

**Key Technologies**:

- Spring WebSocket
- Spring Data MongoDB
- WebSocket (STOMP protocol)
- Cloudinary (chat images)

---

### 5. API Gateway (Port 8888)

**Responsibilities**:

- Route requests to appropriate services
- Centralized authentication
- API documentation aggregation (Swagger)
- CORS handling
- Request logging

**Key Technologies**:

- Spring Cloud Gateway
- Spring WebFlux (reactive)
- OpenAPI/Swagger

---

## 💻 Technology Stack

### Language & Framework

| Component  | Technology           | Version  |
| ---------- | -------------------- | -------- |
| Language   | Java                 | 21       |
| Framework  | Spring Boot          | 3.5.3    |
| Cloud      | Spring Cloud         | 2025.0.0 |
| Gateway    | Spring Cloud Gateway | WebFlux  |
| Build Tool | Maven                | -        |

### Core Libraries

- **Spring Security**: Authentication & Authorization
- **Spring Data JPA**: ORM for relational databases
- **Spring Data MongoDB**: NoSQL database integration
- **Spring Kafka**: Event streaming
- **Spring WebSocket**: Real-time communication
- **Spring Cloud OpenFeign**: Inter-service communication
- **Lombok**: Code generation
- **MapStruct**: Object mapping

### Databases

| Database    | Purpose                          | Port  |
| ----------- | -------------------------------- | ----- |
| MySQL 8.0   | Relational data (users, courses) | 3306  |
| MongoDB 7.0 | Files metadata, chat messages    | 27017 |
| Redis       | Caching, session storage         | 6379  |

### Messaging & Search

| Component          | Purpose                     | Port |
| ------------------ | --------------------------- | ---- |
| Apache Kafka       | Event streaming & messaging | 9092 |
| Zookeeper          | Kafka coordination          | 2181 |
| Elasticsearch 8.12 | Full-text search            | 9200 |
| Kibana             | Data visualization          | 5601 |

### External Services

- **Cloudinary**: Cloud storage for images/videos
- **VNPay**: Payment gateway (Vietnam)
- **PayPal**: International payment
- **Google OAuth**: Social login
- **Facebook OAuth**: Social login
- **SMTP**: Email services

### Security

- **JWT (JSON Web Tokens)**: Stateless authentication
- **OAuth2**: Social login integration
- **Spring Security**: Authorization framework
- **BCrypt**: Password hashing
- **Redis**: Token blacklist

### DevOps & Deployment

- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Maven**: Build automation
- **Health Checks**: Service monitoring

---

## 📁 Project Structure

```
spring-microservices/
│
├── api-gateway/                    # API Gateway Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/devteria/
│   │   │   └── resources/
│   │   │       └── application.yaml
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
│
├── identity-service/               # Identity & Authentication Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/devteria/
│   │   │   └── resources/
│   │   │       └── application.yaml
│   │   └── test/
│   ├── Dockerfile
│   ├── README.md
│   ├── ENV_SETUP.md
│   └── pom.xml
│
├── course-service/                 # Course Management Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/hoangphihiep/
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/  # Flyway migrations
│   │   └── test/
│   ├── Dockerfile
│   ├── seed_courses.sql
│   ├── DASHBOARD_*.md             # Documentation files
│   └── pom.xml
│
├── file-service/                   # File Management Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── Dockerfile
│   └── pom.xml
│
├── chat-service/                   # Chat & Messaging Service
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/demo/
│   │   │   └── resources/
│   │   │       └── application.yml
│   │   └── test/
│   ├── Dockerfile
│   ├── CHAT_API_GUIDE.md
│   ├── MONGODB_CHEATSHEET.md
│   └── pom.xml
│
├── init-db/                        # Database initialization scripts
│   └── 01-init.sql
│
├── docker-compose.yml              # Production deployment
├── docker-compose.dev.yml          # Development deployment
├── build-and-push.sh               # Build & push Docker images
├── build-local.sh                  # Build locally
└── README.md                       # This file
```

### Structure Explanation

**Each service has a similar structure**:

- `src/main/java/`: Main source code
- `src/main/resources/`: Configuration files (application.yml)
- `src/test/`: Unit and integration tests
- `Dockerfile`: Container definition
- `pom.xml`: Maven dependencies and build configuration

**Root level files**:

- `docker-compose.yml`: Orchestrates all services and infrastructure
- `init-db/`: SQL scripts to initialize databases
- `build-*.sh`: Scripts to build and deploy

---

---

## 📚 API Documentation

### Swagger UI

Access API documentation at:

- **Aggregated Docs**: http://localhost:8888/swagger-ui.html
- **Identity Service**: http://localhost:8080/swagger-ui.html
- **Course Service**: http://localhost:8088/swagger-ui.html
- **File Service**: http://localhost:8084/swagger-ui.html
- **Chat Service**: http://localhost:8090/swagger-ui.html

### Sample API Endpoints

#### Authentication

```
POST   /identity/auth/register
POST   /identity/auth/login
POST   /identity/auth/refresh
POST   /identity/auth/logout
GET    /identity/auth/google
GET    /identity/auth/facebook
```

#### User Management

```
GET    /identity/users
GET    /identity/users/{id}
PUT    /identity/users/{id}
DELETE /identity/users/{id}
```

#### Course Management

```
GET    /course-management/courses
POST   /course-management/courses
GET    /course-management/courses/{id}
PUT    /course-management/courses/{id}
DELETE /course-management/courses/{id}
POST   /course-management/courses/{id}/enroll
```

#### File Management

```
POST   /file-handler/upload
GET    /file-handler/files/{id}
DELETE /file-handler/files/{id}
```

#### Chat

```
WS     /server/ws
POST   /server/api/messages
GET    /server/api/conversations
```

---

## 🔧 Development

### Code Style & Standards

- **Java**: Follow Google Java Style Guide
- **Formatting**: Use Spotless Maven Plugin
- **Lombok**: Reduce boilerplate code
- **MapStruct**: Type-safe object mapping

### Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Run specific test
mvn test -Dtest=UserServiceTest
```

### Database Migrations

- **Flyway** is used for database versioning
- Migration scripts in `src/main/resources/db/migration/`

---

## 📞 Support

If you encounter issues, please:

1. Check logs: `docker-compose logs -f [service-name]`
2. View documentation in each service
3. Create an issue on the repository

---

## 📄 License

[Specify your license here]

---

## 👥 Contributors

[List your team members and contributions]

---

**Last Updated**: December 2025
