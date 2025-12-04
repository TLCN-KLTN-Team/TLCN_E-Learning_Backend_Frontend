# Sequence: Admin tạo khóa học

Dưới đây là lược đồ sequence ngắn gọn cho luồng tạo khóa học từ frontend đến backend.

## Mermaid
```mermaid
sequenceDiagram
  autonumber
  actor Admin
  participant FE as Frontend (CourseFormModal)
  participant API as Frontend API (courseApi.createCourse)
  participant GW as API Gateway
  participant CTRL as com.hoangphihiep.controller.Admin.CourseController
  participant SVC as com.hoangphihiep.service.CourseService
  participant REP as com.hoangphihiep.repository.CourseRepository
  participant DB as Database

  Admin->>FE: Mở modal, nhập form, bấm "Tạo Khóa học"
  FE->>API: createCourse(educationalUnitId, CourseRequest)
  API->>GW: POST /course-management/admin/educationalUnit/{id}/courses
  GW->>CTRL: Route request + AuthZ
  CTRL->>SVC: createCourse(educationalUnitId, CourseRequest)
  SVC->>SVC: Validate dữ liệu & quyền
  SVC->>REP: existsByNameAndEduUnitId?
  REP-->>SVC: boolean
  SVC->>REP: save(CourseEntity)
  REP->>DB: INSERT Course (courseName, credits, maxStudents, description, eduUnitId)
  DB-->>REP: Created Course + id
  REP-->>SVC: CourseEntity (persisted)
  SVC-->>CTRL: CourseResponse
  CTRL-->>GW: ApiResponse<CourseResponse>
  GW-->>API: 201 Created
  API-->>FE: CourseResponse
  FE-->>Admin: Toast thành công, đóng modal, reload danh sách
```

## PlantUML
```plantuml
@startuml
actor Admin
participant "Frontend (CourseFormModal)" as FE
participant "Frontend API (courseApi)" as API
participant "API Gateway" as GW
participant "com.hoangphihiep.controller.Admin.CourseController" as CTRL
participant "com.hoangphihiep.service.CourseService" as SVC
participant "com.hoangphihiep.repository.CourseRepository" as REP
database DB

Admin -> FE: Mở modal, nhập form, Tạo Khóa học
FE -> API: createCourse(educationalUnitId, CourseRequest)
API -> GW: POST /.../educationalUnit/{id}/courses
GW -> CTRL: Forward + AuthZ
CTRL -> SVC: createCourse(educationalUnitId, CourseRequest)
SVC -> SVC: Validate dữ liệu & quyền
SVC -> REP: existsByNameAndEduUnitId?
REP --> SVC: boolean
SVC -> REP: save(CourseEntity)
REP -> DB: INSERT Course
DB --> REP: New row + id
REP --> SVC: CourseEntity (persisted)
SVC --> CTRL: CourseResponse
CTRL --> GW: ApiResponse<CourseResponse)
GW --> API: 201 Created
API --> FE: CourseResponse
FE --> Admin: Toast OK, đóng modal, reload
@enduml
```

## Backend nội bộ (Controller → Service → Repository → DB)
- Controller: nhận POST, parse `CourseRequest`, kiểm tra quyền.
- Service: validate nghiệp vụ, kiểm tra trùng tên theo `educationalUnitId`.
- Repository: `save(CourseEntity)` trong transaction.
- DB: ghi bản ghi và trả về khóa chính.

## Lớp và phương thức cụ thể (backend)
- Controller: `com.hoangphihiep.controller.Admin.CourseController`
  - Endpoint: `POST /admin/educationalUnit/{educationalUnitId}/courses`
  - Method: `createCourse(@PathVariable int educationalUnitId, @Valid @RequestBody CourseRequest request)`
- Service: `com.hoangphihiep.service.CourseService`
  - Method: `createCourseForEducationalUnit(int educationalUnitId, CourseRequest request)`
  - Logic: validate quyền, validate dữ liệu, check `existsByCourseNameAndEducationalUnit`, khởi tạo `Course`, `courseRepository.save(course)`, publish `CourseCreatedEvent`, trả `CourseResponse`.
- Repository: `com.hoangphihiep.repository.CourseRepository`
  - Extends: `JpaRepository<Course, Integer>`
  - Methods: `boolean existsByCourseNameAndEducationalUnit(String courseName, int institutionId)`, `Course save(Course entity)`

Ghi chú: đường dẫn thực tế qua API Gateway là `/course-management/admin/educationalUnit/{educationalUnitId}/courses` và được định tuyến về `CourseController` phía course-service.
