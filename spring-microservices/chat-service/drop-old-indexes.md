# Hướng dẫn xóa indexes cũ trong MongoDB

## Lý do cần xóa
ChannelMember đã được chuyển từ separate collection sang embedded document trong Channel.
Các unique indexes cũ trên collection `channel_members` đang gây conflict.

## Các bước thực hiện

### 1. Kết nối MongoDB
```bash
mongosh "mongodb+srv://your-connection-string"
```

### 2. Chọn database
```javascript
use workspace_db
```

### 3. Kiểm tra indexes hiện tại trên collection channels
```javascript
db.channels.getIndexes()
```

### 4. Drop collection channel_members (nếu tồn tại)
```javascript
// Xóa toàn bộ collection channel_members vì không còn dùng nữa
db.channel_members.drop()
```

### 5. Drop các indexes không hợp lệ trên channels (nếu có)
```javascript
// Chỉ drop nếu có index channelMembers.channel_user_unique
db.channels.dropIndex("channelMembers.channel_user_unique")
```

### 6. Xác nhận lại
```javascript
// Kiểm tra lại channels chỉ còn các indexes hợp lệ
db.channels.getIndexes()

// Kết quả mong đợi: chỉ có section_slug_unique và section_created_idx
```

## Hoặc sử dụng script tự động

```javascript
// Script tự động
use workspace_db

print("=== Dropping old indexes and collections ===")

// Drop channel_members collection
if (db.getCollectionNames().includes("channel_members")) {
    db.channel_members.drop()
    print("✓ Dropped collection: channel_members")
} else {
    print("✗ Collection channel_members not found")
}

// Get all indexes on channels
var indexes = db.channels.getIndexes()
print("\nCurrent indexes on channels:")
indexes.forEach(function(index) {
    print(" - " + index.name)
})

// Drop invalid indexes if they exist
var indexesToDrop = ["channelMembers.channel_user_unique", "channel_user_unique", "channel_role_idx", "section_user_cascade_idx", "user_channels_idx"]
indexesToDrop.forEach(function(indexName) {
    try {
        db.channels.dropIndex(indexName)
        print("✓ Dropped index: " + indexName)
    } catch (e) {
        print("✗ Index not found: " + indexName)
    }
})

print("\n=== Done! ===")
```

## Sau khi xóa

1. Restart ứng dụng Spring Boot
2. Test tạo workspace/channel mới
3. Kiểm tra không còn lỗi duplicate key
