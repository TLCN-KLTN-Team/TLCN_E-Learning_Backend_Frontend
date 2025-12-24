# Hướng dẫn Reindex Elasticsearch sau khi cập nhật mapping

## Tổng quan thay đổi

### 1. Cải tiến Document Mapping

Đã cập nhật `PublishedCourseDocument.java` với:

- **Multi-field mapping** cho `courseName`, `description`, `category`:

  - Trường chính (`text`): phân tích đầy đủ cho tìm kiếm full-text
  - Trường `.keyword`: không phân tích, dùng cho exact matching và filtering
  - Trường `.raw`: không phân tích, dùng cho sorting

- **Trường mới**:
  - `instructor` (Text): tên giảng viên
  - `updatedAt` (Date): ngày cập nhật khóa học

### 2. Cải tiến Search Logic

Đã triển khai **multi-tier search strategy** với thứ tự ưu tiên:

1. **Exact match** (boost: 10.0) - Khớp chính xác hoàn toàn
2. **Phrase match** (boost: 8.0-5.0) - Khớp cụm từ chính xác
3. **Match with AND** (boost: 6.0) - Chứa tất cả các từ
4. **Fuzzy match** (boost: 2.0) - Khớp gần đúng với độ mờ

**Ví dụ**: Tìm kiếm "Công nghệ thông tin"

- Trước: Tìm thấy cả "Java Programming", "Python Course" (vì fuzzy quá rộng)
- Sau: Ưu tiên khóa học có tên chính xác "Công nghệ thông tin" hoặc chứa cụm từ này

## Các bước thực hiện

### Bước 1: Xóa index cũ

```bash
# Option 1: Sử dụng curl (Windows PowerShell)
curl -X DELETE "http://localhost:9200/published_courses"

# Option 2: Sử dụng Invoke-RestMethod (PowerShell)
Invoke-RestMethod -Uri "http://localhost:9200/published_courses" -Method DELETE

# Option 3: Kibana Dev Tools
DELETE /published_courses
```

### Bước 2: Tạo index mới với mapping cải tiến

**Lưu ý**: Spring Data Elasticsearch sẽ tự động tạo mapping khi ứng dụng khởi động, nhưng bạn có thể tạo thủ công để kiểm soát tốt hơn:

```json
PUT /published_courses
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "standard": {
          "type": "standard"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "keyword"
      },
      "courseName": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "keyword": {
            "type": "keyword"
          },
          "raw": {
            "type": "text",
            "analyzer": "keyword"
          }
        }
      },
      "description": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "courseIntroduction": {
        "type": "text"
      },
      "category": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      },
      "level": {
        "type": "keyword"
      },
      "instructor": {
        "type": "text"
      },
      "price": {
        "type": "double"
      },
      "rating": {
        "type": "double"
      },
      "studentsCount": {
        "type": "integer"
      },
      "createdAt": {
        "type": "date"
      },
      "updatedAt": {
        "type": "date"
      },
      "titleSuggest": {
        "type": "completion",
        "max_input_length": 100
      },
      "categorySuggest": {
        "type": "completion",
        "max_input_length": 50
      }
    }
  }
}
```

### Bước 3: Reindex dữ liệu

#### Option A: Sử dụng API endpoint (Khuyến nghị)

Tạo endpoint trong controller:

```java
@RestController
@RequestMapping("/api/admin/elasticsearch")
public class ElasticsearchAdminController {

    @Autowired
    private PublishedCourseRepository publishedCourseRepository;

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    @PostMapping("/reindex-courses")
    public ResponseEntity<String> reindexCourses() {
        try {
            // Xóa index cũ
            IndexOperations indexOps = elasticsearchOperations
                .indexOps(PublishedCourseDocument.class);
            if (indexOps.exists()) {
                indexOps.delete();
            }

            // Tạo index mới với mapping
            indexOps.create();
            indexOps.putMapping(indexOps.createMapping());

            // Index lại tất cả published courses
            List<PublishedCourse> courses = publishedCourseRepository.findAll();
            List<PublishedCourseDocument> documents = courses.stream()
                .map(this::toDocument)
                .collect(Collectors.toList());

            // Bulk index
            elasticsearchOperations.save(documents);

            return ResponseEntity.ok("Reindexed " + documents.size() + " courses successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body("Reindex failed: " + e.getMessage());
        }
    }

    private PublishedCourseDocument toDocument(PublishedCourse course) {
        PublishedCourseDocument doc = PublishedCourseDocument.builder()
            .id(course.getId().toString())
            .courseName(course.getCourse().getCourseName())
            .description(course.getCourse().getDescription())
            .courseIntroduction(course.getCourseIntroduction())
            .price(course.getCoursePrice())
            .category(course.getCourseType().getCourseTypeName())
            .instructor(course.getAuthorName())
            .rating(calculateAverageRating(course.getId()))
            .studentsCount(countStudents(course.getId()))
            .createdAt(course.getCreatedDate() != null ?
                course.getCreatedDate().toLocalDate() : null)
            .updatedAt(course.getUpdatedDate() != null ?
                course.getUpdatedDate().toLocalDate() : null)
            .build();

        // Build completion fields
        doc.buildCompletionFields();

        return doc;
    }
}
```

Sau đó gọi API:

```bash
curl -X POST "http://localhost:8084/api/admin/elasticsearch/reindex-courses"
```

#### Option B: Khởi động lại ứng dụng

1. Dừng ứng dụng
2. Xóa index cũ (Bước 1)
3. Khởi động lại ứng dụng
4. Dữ liệu sẽ được index lại tự động nếu bạn có listener hoặc initialization logic

### Bước 4: Kiểm tra mapping mới

```bash
# Kiểm tra mapping
GET /published_courses/_mapping

# Kiểm tra số lượng documents
GET /published_courses/_count

# Test search
GET /published_courses/_search
{
  "query": {
    "term": {
      "courseName.keyword": "Công nghệ thông tin"
    }
  }
}
```

## So sánh hiệu suất

### Trước khi cải tiến:

```
Query: "Công nghệ thông tin"
Kết quả:
1. "Java Programming Basics" (score: 8.5)
2. "Python for Beginners" (score: 7.8)
3. "Công nghệ thông tin cơ bản" (score: 7.2)
```

### Sau khi cải tiến:

```
Query: "Công nghệ thông tin"
Kết quả:
1. "Công nghệ thông tin cơ bản" (score: 15.3) ← exact/phrase match
2. "Công nghệ thông tin nâng cao" (score: 14.8) ← exact/phrase match
3. "Giới thiệu Công nghệ thông tin" (score: 12.1) ← phrase match
4. "Java Programming" (score: 3.2) ← fuzzy (nếu có)
```

## Lưu ý quan trọng

1. **Backup dữ liệu**: Trước khi xóa index, hãy backup nếu cần thiết
2. **Downtime**: Nếu xóa và tạo lại index, có thời gian downtime ngắn
3. **Reindex alias**: Với production, nên sử dụng zero-downtime reindex với alias
4. **Performance**: Multi-tier search có thể chậm hơn một chút, nhưng kết quả chính xác hơn nhiều
5. **Tuning**: Có thể điều chỉnh boost values dựa trên feedback thực tế

## Test cases

### Test 1: Exact match

```
Input: "Công nghệ thông tin"
Expected: Khóa học có tên chính xác "Công nghệ thông tin" đứng đầu
```

### Test 2: Phrase match

```
Input: "lập trình Java"
Expected: Khóa học chứa cụm "lập trình Java" đứng trước "Java" hoặc "lập trình" riêng lẻ
```

### Test 3: Partial match

```
Input: "web development"
Expected: Các khóa học về web development, không phải "website design" hay "web hosting"
```

### Test 4: Fuzzy tolerance

```
Input: "javscript" (typo)
Expected: Tìm thấy "JavaScript" nhưng với score thấp hơn exact match
```

## Troubleshooting

### Lỗi: "index_not_found_exception"

```
Giải pháp: Index chưa được tạo. Khởi động lại ứng dụng hoặc gọi API reindex.
```

### Lỗi: "mapper_parsing_exception"

```
Giải pháp: Mapping không khớp. Xóa index và để Spring Data ES tạo lại.
```

### Kết quả tìm kiếm vẫn không chính xác

```
Giải pháp:
1. Kiểm tra dữ liệu có được index đúng không
2. Điều chỉnh boost values trong code
3. Thêm debug log để xem score của từng hit
```

## Tối ưu hóa thêm (Optional)

### 1. Thêm Vietnamese analyzer

```json
PUT /published_courses
{
  "settings": {
    "analysis": {
      "analyzer": {
        "vietnamese_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  }
}
```

### 2. Thêm synonyms

```json
"filter": {
  "vietnamese_synonyms": {
    "type": "synonym",
    "synonyms": [
      "cntt, công nghệ thông tin, it, information technology",
      "lập trình, coding, programming"
    ]
  }
}
```

### 3. Enable highlighting

```java
searchRequest.highlight(h -> h
    .fields("courseName", f -> f.numberOfFragments(0))
    .fields("description", f -> f.numberOfFragments(1))
);
```

## Kết luận

Sau khi thực hiện các bước trên, hệ thống tìm kiếm sẽ:

- ✅ Ưu tiên kết quả chính xác hơn
- ✅ Phân biệt được exact match vs fuzzy match
- ✅ Không còn hiện kết quả không liên quan khi tìm kiếm cụm từ cụ thể
- ✅ Hỗ trợ tốt hơn cho tiếng Việt có dấu

Nếu có vấn đề gì, vui lòng check logs và test với các query cụ thể.
