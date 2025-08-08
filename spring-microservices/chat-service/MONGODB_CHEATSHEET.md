# MongoDB Quick Reference - Chat Service

## 🚀 Quick Commands

### 1. MongoDB Shell Basics

```javascript
// Connect to database
use workspace_db

// Show collections
show collections

// Find documents
db.messages.find({channelId: "abc123"})

// Count documents
db.messages.countDocuments({channelId: "abc123"})

// Create index
db.messages.createIndex({channelId: 1, createdDate: -1})

// Check indexes
db.messages.getIndexes()

// Explain query
db.messages.find({channelId: "abc123"}).explain("executionStats")
```

### 2. Common Query Patterns

#### Find with Pagination

```java
Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdDate"));
Page<ChatMessage> messages = messageRepository.findByChannelId(channelId, pageable);
```

#### Search in Text

```java
@Query("{ 'message': { $regex: ?0, $options: 'i' } }")
List<ChatMessage> findByMessageContaining(String text);
```

#### Date Range Query

```java
@Query("{ 'createdDate': { $gte: ?0, $lte: ?1 } }")
List<ChatMessage> findByDateRange(Instant start, Instant end);
```

#### Count with Condition

```java
@Query(value = "{ 'channelId': ?0, 'deleted': { $ne: true } }", count = true)
long countActiveMessages(String channelId);
```

### 3. Index Design Rules

1. **Equality → Range → Sort**

   ```java
   @CompoundIndex(def = "{'channelId': 1, 'createdDate': -1}")
   ```

2. **Most Selective First**

   ```java
   @CompoundIndex(def = "{'userId': 1, 'status': 1, 'date': -1}")
   ```

3. **Support Your Queries**
   ```java
   // Query: find({channelId: "abc", userId: "123"}).sort({date: -1})
   @CompoundIndex(def = "{'channelId': 1, 'userId': 1, 'date': -1}")
   ```

### 4. Performance Tips

#### ✅ DO

- Always use pagination
- Index your query fields
- Use projections for large documents
- Implement soft deletes
- Monitor slow queries

#### ❌ DON'T

- Load all documents at once
- Embed large arrays
- Use unindexed regex queries
- Skip validation
- Ignore index usage

### 5. Debugging Commands

```javascript
// Enable profiling for slow queries
db.setProfilingLevel(2, { slowms: 100 });

// View slow queries
db.system.profile.find().sort({ ts: -1 }).limit(5);

// Check index usage
db.messages.find({ channelId: "abc" }).explain("executionStats").executionStats;

// Collection statistics
db.messages.stats();
```

### 6. Useful Aggregation Patterns

#### Group by Field

```java
@Aggregation({
    "{ $match: { 'channelId': ?0 } }",
    "{ $group: { '_id': '$sender.userId', 'count': { $sum: 1 } } }",
    "{ $sort: { 'count': -1 } }"
})
List<MessageCount> getMessageCountByUser(String channelId);
```

#### Date Histogram

```java
@Aggregation({
    "{ $match: { 'channelId': ?0 } }",
    "{ $group: { '_id': { $dateToString: { format: '%Y-%m-%d', date: '$createdDate' } }, 'count': { $sum: 1 } } }",
    "{ $sort: { '_id': 1 } }"
})
List<DailyMessageCount> getDailyMessageCounts(String channelId);
```

### 7. Error Handling

```java
try {
    return messageRepository.save(message);
} catch (DuplicateKeyException e) {
    throw new AppException(ErrorCode.DUPLICATE_MESSAGE);
} catch (DataAccessException e) {
    log.error("Database error: ", e);
    throw new AppException(ErrorCode.DATABASE_ERROR);
}
```

### 8. Configuration Checklist

#### application.yml

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/workspace_db
      database: workspace_db
      auto-index-creation: true # Only for development
```

#### Index Creation

```java
@PostConstruct
public void createIndexes() {
    mongoTemplate.indexOps(ChatMessage.class)
        .ensureIndex(new Index().on("channelId", Sort.Direction.ASC)
                                .on("createdDate", Sort.Direction.DESC));
}
```

---

## 📱 Emergency Debug Commands

When your queries are slow:

1. **Check if index is used:**

   ```javascript
   db.messages.find({ channelId: "abc123" }).explain("executionStats");
   ```

2. **Look for "COLLSCAN"** - this means full collection scan (bad!)

3. **Check "totalDocsExamined" vs "totalDocsReturned"** - should be close

4. **Verify index exists:**

   ```javascript
   db.messages.getIndexes();
   ```

5. **Force index usage:**
   ```javascript
   db.messages.find({ channelId: "abc123" }).hint({ channelId: 1 });
   ```

---

_Keep this reference handy while developing! 🚀_
