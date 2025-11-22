package com.hoangphihiep.utils;

import com.hoangphihiep.entity.*;
import com.hoangphihiep.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Random;
import java.util.Optional;

//@Component // Uncomment this to run automatically on startup
@Component
@RequiredArgsConstructor
public class DataSeeder {

    private final CourseRepository courseRepository;
    private final PublishedCourseRepository publishedCourseRepository;
    private final CourseTypeRepository courseTypeRepository;
    private final EducationalUnitRepository educationalUnitRepository;

    public void seedCourses() {
        try {
            // Kiểm tra xem đã có dữ liệu chưa
            long existingCourses = publishedCourseRepository.count();
            if (existingCourses >= 100) {
                System.out.println("Already have " + existingCourses + " published courses. Skipping seeding.");
                return;
            }

            // Danh sách tên khóa học
            List<String> courseNames = Arrays.asList(
                "Lập trình Python cơ bản", "Java Spring Boot nâng cao", "React.js thực hành",
                "Node.js và Express", "Angular fundamentals", "Vue.js từ A-Z", "Database MySQL",
                "MongoDB và NoSQL", "Machine Learning cơ bản", "Deep Learning với TensorFlow",
                "Data Science với Python", "Web Development Full Stack", "Mobile App với React Native",
                "Flutter cho người mới", "DevOps và Docker", "Kubernetes thực hành",
                "AWS Cloud Computing", "Azure Fundamentals", "Git và GitHub", "Agile và Scrum",
                "UI/UX Design", "Photoshop cơ bản", "Figma cho Designer", "HTML5 và CSS3",
                "JavaScript ES6+", "TypeScript cơ bản", "SQL Server Management", "Oracle Database",
                "Linux Administration", "Network Security", "Ethical Hacking", "Cybersecurity",
                "Blockchain cơ bản", "Smart Contracts", "API Development", "Microservices Architecture",
                "GraphQL APIs", "Redis và Caching", "Elasticsearch", "Apache Kafka",
                "RabbitMQ Messaging", "Testing với Jest", "Selenium WebDriver", "Automation Testing",
                "Performance Testing", "Load Testing", "Software Architecture", "Design Patterns",
                "Clean Code", "SOLID Principles", "TDD và BDD", "CI/CD Pipeline",
                "Artificial Intelligence", "Computer Vision", "Natural Language Processing", "IoT Development",
                "Game Development", "Unity 3D", "Unreal Engine", "Mobile Game Development",
                "Backend Development", "Frontend Development", "API Design", "System Design",
                "Data Structures", "Algorithms", "Software Engineering", "Project Management",
                "Digital Marketing", "SEO Optimization", "Social Media Marketing", "Content Marketing",
                "E-commerce Development", "CRM Systems", "ERP Systems", "Business Intelligence",
                "Cloud Architecture", "Serverless Computing", "Container Orchestration", "Infrastructure as Code",
                "Version Control", "Code Review", "Quality Assurance", "Software Testing",
                "User Experience", "User Interface", "Product Design", "Graphic Design",
                "3D Modeling", "Animation", "Video Editing", "Audio Production",
                "Statistics", "Data Analysis", "Business Analytics", "Financial Modeling",
                "Cryptocurrency", "DeFi Development", "NFT Creation", "Web3 Development",
                "Network Programming", "Embedded Systems", "Robotics", "Hardware Design"
            );

            List<String> descriptions = Arrays.asList(
                "Khóa học trang bị kiến thức cơ bản và nâng cao cho sinh viên và người đi làm",
                "Học từ những chuyên gia hàng đầu trong ngành với nhiều năm kinh nghiệm",
                "Thực hành với các dự án thực tế và case study từ doanh nghiệp",
                "Phát triển kỹ năng chuyên nghiệp và soft skills cần thiết",
                "Cập nhật công nghệ mới nhất và xu hướng phát triển trong ngành",
                "Hướng dẫn chi tiết từng bước với video tutorials chất lượng cao",
                "Xây dựng portfolio ấn tượng để tăng cơ hội việc làm",
                "Chuẩn bị cho thị trường việc làm với các kỹ năng thực tế"
            );

            List<String> introductions = Arrays.asList(
                "Khóa học được thiết kế cho người mới bắt đầu muốn tìm hiểu về lĩnh vực này",
                "Phù hợp cho các lập trình viên, kỹ sư muốn nâng cao kỹ năng chuyên môn",
                "Tập trung vào thực hành và ứng dụng thực tế trong công việc",
                "Học cùng mentor giàu kinh nghiệm và đội ngũ hỗ trợ chuyên nghiệp",
                "Phương pháp học hiện đại, hiệu quả với công nghệ e-learning tiên tiến",
                "Hỗ trợ học viên 24/7 qua các kênh online và offline",
                "Cộng đồng học tập sôi động với hàng nghìn học viên",
                "Chứng chỉ hoàn thành có giá trị được công nhận bởi các doanh nghiệp"
            );

            List<String> achievements = Arrays.asList(
                "Thành thạo các khái niệm cơ bản và nâng cao trong lĩnh vực",
                "Xây dựng được ứng dụng hoàn chỉnh từ ý tưởng đến triển khai",
                "Làm việc hiệu quả trong môi trường nhóm và dự án thực tế",
                "Tự tin phỏng vấn việc làm và thể hiện năng lực chuyên môn",
                "Hiểu sâu về best practices và coding standards trong ngành",
                "Triển khai ứng dụng lên production và vận hành hệ thống",
                "Debugging, troubleshooting và tối ưu hóa hiệu suất",
                "Quản lý dự án và teamwork trong môi trường Agile"
            );

            List<String> images = Arrays.asList(
                "python_course.jpg", "java_spring.jpg", "react_course.jpg", "nodejs_course.jpg",
                "angular_course.jpg", "vue_course.jpg", "mysql_course.jpg", "mongodb_course.jpg",
                "ml_course.jpg", "dl_course.jpg", "datascience_course.jpg", "fullstack_course.jpg",
                "reactnative_course.jpg", "flutter_course.jpg", "devops_course.jpg", "kubernetes_course.jpg",
                "aws_course.jpg", "azure_course.jpg", "github_course.jpg", "agile_course.jpg",
                "uiux_course.jpg", "photoshop_course.jpg", "figma_course.jpg", "html_course.jpg"
            );

            // Các teacher ID thực tế
            String[] teacherIds = {"baf701dc-eb2a-4560-9102-cf41ff91d833", "018d3478-2c48-4c31-8a7e-8c37a8b02853"};
            
            Random random = new Random();
            Date now = new Date();

            // Tạo 100 courses
            for (int i = 0; i < 100; i++) {
                // Tạo Course
                Course course = new Course();
                course.setCourseName(courseNames.get(i % courseNames.size()) + " - Lớp " + (i + 1));
                course.setDescription(descriptions.get(random.nextInt(descriptions.size())));
                course.setCredits(random.nextInt(4) + 1); // 1-4 credits
                course.setMaxStudents(random.nextInt(50) + 20); // 20-70 students
                course.setCurrentStudents(random.nextInt(15)); // 0-14 current students
                course.setCreatedAt(now);
                course.setUpdatedAt(now);
                
                // Random teacher
                int teacherIndex = random.nextInt(2);
                course.setIdTeacher(teacherIds[teacherIndex]);
                
                // Set educational unit (fixed as 1)
                Optional<EducationalUnit> educationalUnitOpt = educationalUnitRepository.findById(1);
                if (educationalUnitOpt.isPresent()) {
                    course.setEducationalUnit(educationalUnitOpt.get());
                } else {
                    // Create a minimal educational unit if not exists
                    EducationalUnit educationalUnit = new EducationalUnit();
                    educationalUnit.setId(1);
                    educationalUnit.setName("Trường Đại học Sư phạm Kỹ thuật TP.HCM");
                    educationalUnit.setType("Đại học");
                    educationalUnit.setAddress("1 Võ Văn Ngân, Thủ Đức, TP.HCM");
                    educationalUnit = educationalUnitRepository.save(educationalUnit);
                    course.setEducationalUnit(educationalUnit);
                }
                
                Course savedCourse = courseRepository.save(course);

                // Tạo PublishedCourse
                PublishedCourse publishedCourse = new PublishedCourse();
                publishedCourse.setCourse(savedCourse);
                publishedCourse.setCoursePrice(BigDecimal.valueOf(random.nextInt(800000) + 200000)); // 200k-1M
                publishedCourse.setCreatedAt(now);
                publishedCourse.setUpdatedAt(now);
                publishedCourse.setStatus(1); // Published
                
                // Random course type (1-3)
                Optional<CourseType> courseTypeOpt = courseTypeRepository.findById(random.nextInt(3) + 1);
                if (courseTypeOpt.isPresent()) {
                    publishedCourse.setCourseType(courseTypeOpt.get());
                } else {
                    // Create default course types if not exist
                    CourseType courseType = new CourseType();
                    courseType.setCourseTypeName("Lập trình căn bản");
                    courseType.setDescription("Các khóa học nhập môn cho người mới bắt đầu học lập trình.");
                    courseType.setDeleted(false);
                    courseType = courseTypeRepository.save(courseType);
                    publishedCourse.setCourseType(courseType);
                }
                
                publishedCourseRepository.save(publishedCourse);
                
                if ((i + 1) % 10 == 0) {
                    System.out.println("Created " + (i + 1) + " courses...");
                }
            }

            System.out.println("Successfully created 100 published courses!");
            
        } catch (Exception e) {
            System.err.println("Error creating courses: " + e.getMessage());
            e.printStackTrace();
        }
    }
}