-- Script để tạo 100 published courses
-- Chạy script này trực tiếp trong MySQL database

-- Đầu tiên, đảm bảo có educational_unit với id = 1
INSERT IGNORE INTO educational_units (id, name, type, address, phone, email, website) 
VALUES (1, 'Trường Đại học Sư phạm Kỹ thuật TP.HCM', 'Đại học', '1 Võ Văn Ngân, Thủ Đức, TP.HCM', '028-38968641', 'info@hcmute.edu.vn', 'https://hcmute.edu.vn');

-- Đảm bảo có course_type
INSERT IGNORE INTO course_type (id, course_type_name, description, is_deleted) VALUES 
(1, 'Lập trình căn bản', 'Các khóa học nhập môn cho người mới bắt đầu học lập trình.', 0),
(2, 'Phát triển Web', 'Các khóa học về HTML, CSS, JavaScript, React,...', 0),
(3, 'Khoa học dữ liệu', 'Các khóa học về Python, phân tích dữ liệu và Machine Learning.', 0);

-- Procedure để tạo courses
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CreateCourses()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE course_name_base VARCHAR(255);
    DECLARE course_desc TEXT;
    DECLARE course_intro TEXT;
    DECLARE achievement TEXT;
    DECLARE image_name VARCHAR(255);
    DECLARE teacher_id VARCHAR(255);
    DECLARE course_id INT;
    DECLARE detail_id INT;
    DECLARE type_id INT;
    DECLARE price INT;
    DECLARE learners INT;
    DECLARE max_students INT;
    DECLARE current_students INT;
    DECLARE credits INT;
    
    -- Mảng tên khóa học
    DECLARE course_names TEXT DEFAULT 'Lập trình Python cơ bản,Java Spring Boot nâng cao,React.js thực hành,Node.js và Express,Angular fundamentals,Vue.js từ A-Z,Database MySQL,MongoDB và NoSQL,Machine Learning cơ bản,Deep Learning với TensorFlow,Data Science với Python,Web Development Full Stack,Mobile App với React Native,Flutter cho người mới,DevOps và Docker,Kubernetes thực hành,AWS Cloud Computing,Azure Fundamentals,Git và GitHub,Agile và Scrum,UI/UX Design,Photoshop cơ bản,Figma cho Designer,HTML5 và CSS3,JavaScript ES6+,TypeScript cơ bản,SQL Server Management,Oracle Database,Linux Administration,Network Security,Ethical Hacking,Cybersecurity,Blockchain cơ bản,Smart Contracts,API Development,Microservices Architecture,GraphQL APIs,Redis và Caching,Elasticsearch,Apache Kafka,RabbitMQ Messaging,Testing với Jest,Selenium WebDriver,Automation Testing,Performance Testing,Load Testing,Software Architecture,Design Patterns,Clean Code,SOLID Principles';
    
    DECLARE descriptions TEXT DEFAULT 'Khóa học trang bị kiến thức cơ bản và nâng cao cho sinh viên và người đi làm,Học từ những chuyên gia hàng đầu trong ngành với nhiều năm kinh nghiệm,Thực hành với các dự án thực tế và case study từ doanh nghiệp,Phát triển kỹ năng chuyên nghiệp và soft skills cần thiết,Cập nhật công nghệ mới nhất và xu hướng phát triển trong ngành,Hướng dẫn chi tiết từng bước với video tutorials chất lượng cao,Xây dựng portfolio ấn tượng để tăng cơ hội việc làm,Chuẩn bị cho thị trường việc làm với các kỹ năng thực tế';
    
    DECLARE introductions TEXT DEFAULT 'Khóa học được thiết kế cho người mới bắt đầu muốn tìm hiểu về lĩnh vực này,Phù hợp cho các lập trình viên, kỹ sư muốn nâng cao kỹ năng chuyên môn,Tập trung vào thực hành và ứng dụng thực tế trong công việc,Học cùng mentor giàu kinh nghiệm và đội ngũ hỗ trợ chuyên nghiệp,Phương pháp học hiện đại, hiệu quả với công nghệ e-learning tiên tiến,Hỗ trợ học viên 24/7 qua các kênh online và offline,Cộng đồng học tập sôi động với hàng nghìn học viên,Chứng chỉ hoàn thành có giá trị được công nhận bởi các doanh nghiệp';
    
    DECLARE achievements_list TEXT DEFAULT 'Thành thạo các khái niệm cơ bản và nâng cao trong lĩnh vực,Xây dựng được ứng dụng hoàn chỉnh từ ý tưởng đến triển khai,Làm việc hiệu quả trong môi trường nhóm và dự án thực tế,Tự tin phỏng vấn việc làm và thể hiện năng lực chuyên môn,Hiểu sâu về best practices và coding standards trong ngành,Triển khai ứng dụng lên production và vận hành hệ thống,Debugging, troubleshooting và tối ưu hóa hiệu suất,Quản lý dự án và teamwork trong môi trường Agile';
    
    DECLARE images TEXT DEFAULT 'python_course.jpg,java_spring.jpg,react_course.jpg,nodejs_course.jpg,angular_course.jpg,vue_course.jpg,mysql_course.jpg,mongodb_course.jpg,ml_course.jpg,dl_course.jpg,datascience_course.jpg,fullstack_course.jpg,reactnative_course.jpg,flutter_course.jpg,devops_course.jpg,kubernetes_course.jpg';
    
    WHILE i <= 100 DO
        -- Random values
        SET course_name_base = SUBSTRING_INDEX(SUBSTRING_INDEX(course_names, ',', ((i-1) % 50) + 1), ',', -1);
        SET course_desc = SUBSTRING_INDEX(SUBSTRING_INDEX(descriptions, ',', (i % 8) + 1), ',', -1);
        SET course_intro = SUBSTRING_INDEX(SUBSTRING_INDEX(introductions, ',', (i % 8) + 1), ',', -1);
        SET achievement = SUBSTRING_INDEX(SUBSTRING_INDEX(achievements_list, ',', (i % 8) + 1), ',', -1);
        SET image_name = SUBSTRING_INDEX(SUBSTRING_INDEX(images, ',', (i % 16) + 1), ',', -1);
        SET teacher_id = IF(i % 2 = 1, 'baf701dc-eb2a-4560-9102-cf41ff91d833', 'bee87ec2-5fee-4600-92b4-e7d762e162d4');
        SET type_id = (i % 3) + 1;
        SET price = 200000 + (i * 7919) % 800000; -- Random price between 200k-1M
        SET learners = 50 + (i * 1234) % 200; -- Random learners 50-250
        SET max_students = 20 + (i * 567) % 50; -- Random max students 20-70
        SET current_students = (i * 321) % 15; -- Random current students 0-14
        SET credits = (i % 4) + 1; -- 1-4 credits
        
        -- Insert Course
        INSERT INTO course (course_name, description, credits, max_students, current_students, created_at, updated_at, teacher_id, educationalUnit_id)
        VALUES (
            CONCAT(course_name_base, ' - Lớp ', i),
            course_desc,
            credits,
            max_students,
            current_students,
            NOW(),
            NOW(),
            teacher_id,
            1
        );
        
        SET course_id = LAST_INSERT_ID();
        
        -- Insert CourseDetail
        INSERT INTO course_detail (description, course_introduction, course_image, course_video, learner_achievements, course_learner)
        VALUES (
            course_desc,
            course_intro,
            image_name,
            CONCAT('video_', i, '.mp4'),
            achievement,
            learners
        );
        
        SET detail_id = LAST_INSERT_ID();
        
        -- Insert PublishedCourse
        INSERT INTO PublishedCourse (course_price, created_at, updated_at, status, course_id, course_detail_id, course_type_id)
        VALUES (
            price,
            NOW(),
            NOW(),
            1,
            course_id,
            detail_id,
            type_id
        );
        
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Chạy procedure
CALL CreateCourses();

-- Xóa procedure sau khi sử dụng
DROP PROCEDURE CreateCourses;

-- Kiểm tra kết quả
SELECT COUNT(*) as 'Total Published Courses' FROM PublishedCourse;
SELECT COUNT(*) as 'Total Courses' FROM course;
SELECT COUNT(*) as 'Total Course Details' FROM course_detail;

-- Hiển thị một vài courses mẫu
SELECT 
    pc.id,
    c.course_name,
    pc.course_price,
    ct.course_type_name,
    cd.course_learner,
    c.teacher_id,
    pc.created_at
FROM PublishedCourse pc
JOIN course c ON pc.course_id = c.id
JOIN course_detail cd ON pc.course_detail_id = cd.id
JOIN course_type ct ON pc.course_type_id = ct.id
ORDER BY pc.id
LIMIT 10;