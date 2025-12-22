# MongoDB và NoSQL: Hướng dẫn Nâng cao cho Chat Service

## 📋 Mục Lục

1. [Khái niệm cơ bản](#khái-niệm-cơ-bản)
2. [So sánh SQL vs NoSQL](#so-sánh-sql-vs-nosql)
3. [Entity Design trong MongoDB](#entity-design-trong-mongodb)
4. [Index Strategies](#index-strategies)
5. [Query Optimization](#query-optimization)
6. [CRUD Operations](#crud-operations)
7. [Best Practices](#best-practices)
8. [Performance Tuning](#performance-tuning)
9. [Troubleshooting](#troubleshooting)

## 🎯 Khái niệm cơ bản

### MongoDB là gì?

MongoDB là một **document-oriented database** thuộc họ NoSQL. Thay vì lưu trữ dữ liệu trong các bảng và hàng như SQL, MongoDB lưu trữ dữ liệu dưới dạng **documents** (tài liệu) trong các **collections** (bộ sưu tập).

### Cấu trúc cơ bản:

- **Database**: Tương đương với database trong SQL
- **Collection**: Tương đương với table trong SQL
- **Document**: Tương đương với row trong SQL
- **Field**: Tương đương với column trong SQL

```javascript
// Ví dụ Document trong MongoDB
{
  "_id": ObjectId("..."),
  "name": "Programming Course",
  "members": [
    {
      "userId": "user123",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "createdAt": ISODate("2024-01-01T00:00:00Z")
}
```

## 🔄 So sánh SQL vs NoSQL

| Aspect             | SQL (RDBMS)          | NoSQL (MongoDB)                |
| ------------------ | -------------------- | ------------------------------ |
| **Schema**         | Fixed, rigid schema  | Flexible, dynamic schema       |
| **Relationships**  | Foreign keys, JOINs  | Embedded documents, references |
| **Scaling**        | Vertical scaling     | Horizontal scaling             |
| **ACID**           | Full ACID compliance | Eventually consistent          |
| **Query Language** | SQL                  | MongoDB Query Language (MQL)   |

### Khi nào dùng NoSQL?

✅ **Nên dùng khi:**

- Dữ liệu có cấu trúc đa dạng, thay đổi thường xuyên
- Cần scale horizontally (nhiều server)
- Dữ liệu có quan hệ phức tạp (nested data)
- Prototype nhanh, development agile

❌ **Không nên dùng khi:**

- Cần ACID transactions nghiêm ngặt
- Có nhiều complex queries với JOINs
- Dữ liệu có cấu trúc ổn định, ít thay đổi

## 🏗 Entity Design trong MongoDB

### 1. Embedding vs Referencing

#### **Embedding** (Nhúng document)

```java
// Channel with embedded messages
@Document(collection = "channels")
public class Channel {
    @MongoId String id;
    String channelName;
    List<ChatMessage> messages; // ❌ Không tốt cho large datasets
    List<Participant> participants; // ✅ Tốt cho small, stable data
}
```

**Khi nào dùng Embedding:**

- Dữ liệu nhỏ, ít thay đổi
- Thường được truy cập cùng nhau
- One-to-few relationship

#### **Referencing** (Tham chiếu)

```java
// Channel with message references
@Document(collection = "channels")
public class Channel {
    @MongoId String id;
    String channelName;
    // messages stored separately
    List<Participant> participants;
}

@Document(collection = "messages")
public class ChatMessage {
    @MongoId String id;
    @Indexed String channelId; // Reference to channel
    String message;
}
```

**Khi nào dùng Referencing:**

- Dữ liệu lớn, thay đổi thường xuyên
- One-to-many, many-to-many relationships
- Cần query độc lập

### 2. Document Structure Best Practices

```java
@Document(collection = "workspaces")
@CompoundIndex(def = "{'ownerId': 1, 'createdAt': -1}")
@CompoundIndex(def = "{'courseId': 1, 'isActive': 1}")
public class Workspace {
    @MongoId String id;

    @Indexed String name;
    @Indexed String ownerId;
    @Indexed String courseId;

    // Embedded for small, stable data
    List<Participant> members;

    // References for large, changing data
    List<String> channelIds; // ✅ Store references instead of full objects

    @Indexed Instant createdAt;
    @Indexed boolean isActive; // ✅ Soft delete support
}
```

## 📊 Index Strategies

### 1. Single Field Indexes

```java
@Document(collection = "messages")
public class ChatMessage {
    @MongoId String id;
    @Indexed String channelId; // Single field index
    @Indexed Instant createdDate; // Single field index
    String message;
}
```

### 2. Compound Indexes

```java
// Compound index for efficient queries
@CompoundIndex(def = "{'channelId': 1, 'createdDate': -1}")
@CompoundIndex(def = "{'channelId': 1, 'sender.userId': 1, 'createdDate': -1}")
public class ChatMessage {
    // fields...
}
```

**Index Order Rules:**

- Equality → Range → Sort
- Most selective fields first

### 3. Index Types

#### **Regular Index**

```java
@Indexed String channelId; // B-tree index
```

#### **Text Index** (cho search)

```java
@TextIndexed String message; // Full-text search
```

#### **Sparse Index** (chỉ index documents có field)

```java
@Indexed(sparse = true) String optionalField;
```

### 4. MongoDB Query Planning

```javascript
// Explain query để see performance
db.messages.find({ channelId: "abc123" }).explain("executionStats");

// Check nếu query sử dụng index
db.messages.find({ channelId: "abc123" }).hint({ channelId: 1 });
```

## 🔍 Query Optimization

### 1. Repository Query Methods

```java
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    // ✅ Good: Uses index on channelId
    @Query("{ 'channelId': ?0, 'deleted': { $ne: true } }")
    Page<ChatMessage> findByChannelIdAndNotDeleted(String channelId, Pageable pageable);

    // ✅ Good: Compound index usage
    @Query("{ 'channelId': ?0, 'createdDate': { $gte: ?1, $lte: ?2 } }")
    Page<ChatMessage> findByChannelIdAndCreatedDateBetween(
        String channelId, Instant start, Instant end, Pageable pageable);

    // ✅ Good: Regex with index (starts with pattern)
    @Query("{ 'channelId': ?0, 'message': { $regex: '^?1', $options: 'i' } }")
    List<ChatMessage> findByChannelIdAndMessageStartsWith(String channelId, String prefix);

    // ❌ Bad: Full collection scan
    @Query("{ 'message': { $regex: '?0', $options: 'i' } }")
    List<ChatMessage> findByMessageContains(String text);
}
```

### 2. Aggregation Pipeline

```java
// Complex queries using aggregation
@Aggregation(pipeline = {
    "{ $match: { 'channelId': ?0 } }",
    "{ $group: { '_id': '$sender.userId', 'messageCount': { $sum: 1 } } }",
    "{ $sort: { 'messageCount': -1 } }",
    "{ $limit: 10 }"
})
List<MessageCountByUser> getTopMessageSenders(String channelId);
```

### 3. Projection (chỉ lấy fields cần thiết)

```java
// ✅ Good: Only get needed fields
@Query(value = "{ 'channelId': ?0 }", fields = "{ 'message': 1, 'createdDate': 1, 'sender.firstName': 1 }")
List<ChatMessage> findMessageSummaryByChannelId(String channelId);
```

## 🛠 CRUD Operations

### 1. Create Operations

```java
@Service
public class ChatMessageServiceImpl {

    public ChatMessageResponse createMessage(ChatMessageRequest request) {
        // ✅ Validate trước khi save
        Channel channel = channelRepository.findById(request.getChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.UN_EXISTING_CHANNEL));

        // ✅ Set timestamps explicitly
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .channelId(request.getChannelId())
                .message(request.getMessage())
                .createdDate(Instant.now())
                .updatedDate(Instant.now())
                .build();

        // ✅ Single save operation
        return chatMessageRepository.save(message);
    }
}
```

### 2. Read Operations with Pagination

```java
public PageResponse<ChatMessageResponse> getMessages(String channelId, int page, int size) {
    // ✅ Always use pagination for large datasets
    Pageable pageable = PageRequest.of(page, size,
        Sort.by(Sort.Direction.DESC, "createdDate"));

    Page<ChatMessage> messagePage = chatMessageRepository
        .findByChannelIdAndNotDeleted(channelId, pageable);

    return convertToPageResponse(messagePage);
}
```

### 3. Update Operations

```java
// ✅ Atomic updates using @Query + @Update
@Query("{ 'id': ?0 }")
@Update("{ $set: { 'message': ?1, 'updatedDate': ?2, 'edited': true } }")
void updateMessage(String messageId, String newMessage, Instant updatedAt);

// ✅ Soft delete
@Query("{ 'id': ?0 }")
@Update("{ $set: { 'deleted': true, 'updatedDate': ?1 } }")
void softDeleteMessage(String messageId, Instant deletedAt);
```

### 4. Batch Operations

```java
// ✅ Bulk operations for better performance
public void markMessagesAsRead(List<String> messageIds, String userId) {
    Criteria criteria = Criteria.where("id").in(messageIds);
    Update update = new Update()
        .addToSet("readBy", userId)
        .set("updatedDate", Instant.now());

    mongoTemplate.updateMulti(Query.query(criteria), update, ChatMessage.class);
}
```

## ⚡ Best Practices

### 1. Schema Design

```java
// ✅ Good Schema Design
@Document(collection = "messages")
@CompoundIndex(def = "{'channelId': 1, 'createdDate': -1}") // Most common query
@CompoundIndex(def = "{'sender.userId': 1, 'createdDate': -1}") // User's messages
public class ChatMessage {
    @MongoId String id;

    @Indexed String channelId; // Always indexed for filtering

    // Embedded participant info (denormalization for performance)
    Participant sender; // ✅ Small, stable data

    String message;

    @Builder.Default
    MessageType messageType = MessageType.TEXT;

    // References for large data
    List<String> attachmentIds; // ✅ Store references, not full objects

    @Indexed Instant createdDate;
    Instant updatedDate;

    // Soft delete support
    @Builder.Default boolean deleted = false;
}
```

### 2. Avoid Common Pitfalls

```java
// ❌ BAD: Embedding large arrays
public class Channel {
    List<ChatMessage> messages; // Can grow infinitely!
}

// ✅ GOOD: Reference pattern
public class Channel {
    String id;
    // Store references or use separate collection
}

// ❌ BAD: No pagination
List<ChatMessage> getAllMessages(String channelId);

// ✅ GOOD: Always paginate
Page<ChatMessage> getMessages(String channelId, Pageable pageable);

// ❌ BAD: N+1 queries
for (Channel channel : channels) {
    List<Message> messages = messageRepo.findByChannelId(channel.getId());
}

// ✅ GOOD: Batch queries
Map<String, List<Message>> messagesByChannel = messageRepo
    .findByChannelIdIn(channelIds)
    .stream()
    .collect(groupingBy(Message::getChannelId));
```

### 3. Data Validation

```java
@Document(collection = "workspaces")
public class Workspace {
    @NotBlank
    @Size(min = 1, max = 100)
    String name;

    @Valid // Validate embedded objects
    List<Participant> members;

    // Custom validation
    @AssertTrue
    public boolean isValidWorkspace() {
        return members != null && !members.isEmpty();
    }
}
```

## 🚀 Performance Tuning

### 1. Index Performance

```javascript
// MongoDB Shell commands for performance analysis

// 1. Check index usage
db.messages.getIndexes();

// 2. Analyze query performance
db.messages.find({ channelId: "abc" }).explain("executionStats");

// 3. Check slow queries
db.setProfilingLevel(2, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(5);

// 4. Index statistics
db.messages.aggregate([{ $indexStats: {} }]);
```

### 2. Spring Boot Configuration

```yaml
# application.dev.yml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/chatdb
      database: chatdb
      auto-index-creation: true # ✅ Auto create indexes from annotations

# Performance settings
spring:
  data:
    mongodb:
      field-naming-strategy: org.springframework.data.mapping.model.SnakeCaseFieldNamingStrategy

# Connection pooling
spring:
  data:
    mongodb:
      options:
        max-connection-pool-size: 100
        min-connection-pool-size: 10
        max-connection-idle-time: 60000
        max-connection-life-time: 120000
```

### 3. Repository Optimization

```java
@Repository
public interface OptimizedMessageRepository extends MongoRepository<ChatMessage, String> {

    // ✅ Use projection for summary data
    @Query(value = "{ 'channelId': ?0 }",
           fields = "{ 'message': 1, 'sender.firstName': 1, 'createdDate': 1 }")
    List<MessageSummary> findMessageSummaries(String channelId);

    // ✅ Use hints for complex queries
    @Query("{ 'channelId': ?0, 'createdDate': { $gte: ?1 } }")
    @Meta(flags = {Meta.CursorOption.NO_TIMEOUT})
    Stream<ChatMessage> findRecentMessagesStream(String channelId, Instant since);

    // ✅ Count operations with optimization
    @Query(value = "{ 'channelId': ?0 }", count = true)
    long countByChannelId(String channelId);
}
```

### 4. Caching Strategy

```java
@Service
@CacheConfig(cacheNames = "messages")
public class CachedMessageService {

    @Cacheable(key = "#channelId + '_' + #page + '_' + #size")
    public PageResponse<ChatMessageResponse> getMessages(String channelId, int page, int size) {
        // Implementation
    }

    @CacheEvict(key = "#message.channelId + '_*'", allEntries = true)
    public ChatMessage createMessage(ChatMessage message) {
        // Implementation
    }
}
```

## 🔧 Troubleshooting

### 1. Common Issues và Solutions

#### **Issue: Slow Queries**

```java
// Problem: Missing indexes
@Query("{ 'message': { $regex: ?0, $options: 'i' } }")
List<ChatMessage> searchMessages(String text); // Full collection scan!

// Solution: Add text index
@Document(collection = "messages")
@TextIndexed // Add text index for full-text search
public class ChatMessage {
    @TextIndexed String message;
}

// Better query
@Query("{ $text: { $search: ?0 } }")
List<ChatMessage> searchMessagesText(String text);
```

#### **Issue: Memory Problems**

```java
// Problem: Loading too much data
List<ChatMessage> getAllMessages(String channelId); // Can load millions!

// Solution: Always paginate
Page<ChatMessage> getMessages(String channelId, Pageable pageable);

// Solution: Use projections for summary data
@Query(value = "{ 'channelId': ?0 }", fields = "{ 'id': 1, 'message': 1 }")
List<MessageSummary> getMessageSummaries(String channelId);
```

#### **Issue: Document Size Limits**

```java
// Problem: Documents > 16MB limit
public class Channel {
    List<ChatMessage> messages; // Can exceed 16MB!
}

// Solution: Reference pattern
public class Channel {
    List<String> messageIds; // Store references only
}
```

### 2. Monitoring Tools

```java
// Add MongoDB metrics to your application
@Component
public class MongoMetrics {

    @EventListener
    public void handleMongoEvent(MongoMappingEvent<?> event) {
        // Log slow operations
        if (event instanceof AfterLoadEvent) {
            long duration = event.getTimestamp() - startTime;
            if (duration > 1000) { // > 1 second
                log.warn("Slow MongoDB operation: {}ms", duration);
            }
        }
    }
}

// Health check
@Component
public class MongoHealthIndicator implements HealthIndicator {
    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public Health health() {
        try {
            mongoTemplate.execute("admin", collection -> {
                collection.runCommand(new org.bson.Document("ping", 1));
                return "pong";
            });
            return Health.up().withDetail("database", "MongoDB").build();
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

### 3. Debug Configuration

```yaml
# Enable MongoDB debug logging
logging:
  level:
    org.springframework.data.mongodb.core: DEBUG
    org.springframework.data.mongodb.repository: DEBUG

# Show actual MongoDB queries
spring:
  data:
    mongodb:
      field-naming-strategy: org.springframework.data.mapping.model.SnakeCaseFieldNamingStrategy
# Enable query logging in MongoDB
# Add to mongod.conf:
# systemLog:
#   verbosity: 1
#   component:
#     query:
#       verbosity: 2
```

## 📈 Migration từ SQL sang MongoDB

### 1. Mapping Concepts

| SQL Concept | MongoDB Equivalent  | Example                                 |
| ----------- | ------------------- | --------------------------------------- |
| Table       | Collection          | `users` table → `users` collection      |
| Row         | Document            | User record → User document             |
| Column      | Field               | `first_name` column → `firstName` field |
| Primary Key | \_id field          | `id` → `_id`                            |
| Foreign Key | Reference/Embedding | `user_id` → embedded user object        |
| JOIN        | $lookup/$unwind     | JOIN users → $lookup from users         |
| GROUP BY    | $group              | GROUP BY → $group aggregation           |

### 2. Query Translation Examples

```sql
-- SQL Query
SELECT u.name, COUNT(m.id) as message_count
FROM users u
LEFT JOIN messages m ON u.id = m.user_id
WHERE u.active = true
GROUP BY u.id, u.name
ORDER BY message_count DESC
LIMIT 10;
```

```javascript
// MongoDB Aggregation equivalent
db.users.aggregate([
  { $match: { active: true } },
  {
    $lookup: {
      from: "messages",
      localField: "_id",
      foreignField: "userId",
      as: "messages",
    },
  },
  {
    $project: {
      name: 1,
      messageCount: { $size: "$messages" },
    },
  },
  { $sort: { messageCount: -1 } },
  { $limit: 10 },
]);
```

## 🎓 Kết luận

MongoDB mang lại nhiều lợi ích cho ứng dụng chat:

✅ **Ưu điểm:**

- Flexible schema phù hợp với dữ liệu đa dạng
- Horizontal scaling tốt
- Performance cao với proper indexing
- Hỗ trợ tốt cho nested data structures

⚠️ **Lưu ý quan trọng:**

- Luôn thiết kế indexes cẩn thận
- Sử dụng pagination cho all queries
- Monitor performance thường xuyên
- Validate data properly
- Implement proper error handling

**Next Steps:**

1. Implement monitoring và alerting
2. Set up backup strategies
3. Consider sharding for very large datasets
4. Implement proper security measures
5. Regular performance reviews

---

_Happy coding! 🚀_
