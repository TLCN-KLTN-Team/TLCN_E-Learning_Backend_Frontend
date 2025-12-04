# Fix cho Duplicate Key Constraint Violation trong Content Visibility

## Vấn đề (Problem)

Khi cập nhật visibility cho section/lesson/quiz/assignment, hệ thống báo lỗi:

```
org.springframework.dao.DataIntegrityViolationException: 
Duplicate entry '3-SECTION-3' for key 'class_content_visibility.UKgrp3fdj8e8fu3umj3cs9ei8pf'
```

### Nguyên nhân (Root Cause)

Bảng `class_content_visibility` có **unique constraint** trên 3 cột:
- `class_id`
- `content_type` 
- `content_id`

Code cũ sử dụng chiến lược **delete-then-insert**:
1. Xóa tất cả records cũ: `deleteByContentTypeAndContentId()`
2. Thêm records mới: `saveAll()`

**Vấn đề**: Trong cùng một transaction, câu lệnh DELETE chưa được flush xuống database trước khi INSERT được thực thi, dẫn đến vi phạm unique constraint.

### Ví dụ cụ thể

- Section ID = 3
- Lớp "Sáng 01" có ID = 3 (đã có visibility)
- Thêm lớp "Chiều A" có ID = 3 (cùng ID nhưng là class khác)

➡️ Khi INSERT record mới `(3, 'SECTION', 3)`, record cũ chưa bị xóa khỏi database → **Duplicate key error**

## Giải pháp (Solution)

### Thay đổi chiến lược từ "Delete All + Insert" sang "Smart Update"

#### Code cũ (Old Code):
```java
@Transactional
public void updateSectionVisibility(Integer sectionId, List<Integer> visibleClassIds) {
    // Xóa TẤT CẢ visibility cũ
    visibilityRepository.deleteByContentTypeAndContentId("SECTION", sectionId);
    
    // Tạo visibility MỚI cho tất cả classes
    // ... saveAll(visibilities)
}
```

#### Code mới (New Code):
```java
@Transactional
public void updateSectionVisibility(Integer sectionId, List<Integer> visibleClassIds) {
    // 1. Lấy visibility hiện có
    List<ClassContentVisibility> existingVisibilities = 
            visibilityRepository.findByContentTypeAndContentId("SECTION", sectionId);
    
    // 2. Xác định cái nào cần XÓA (không còn trong danh sách mới)
    List<ClassContentVisibility> toDelete = existingVisibilities.stream()
            .filter(v -> visibleClassIds == null || !visibleClassIds.contains(v.getCourseClass().getId()))
            .collect(Collectors.toList());
    
    // 3. Xác định cái nào cần THÊM (chưa có trong danh sách cũ)
    List<Integer> toAdd = visibleClassIds.stream()
            .filter(classId -> !existingClassIds.contains(classId))
            .collect(Collectors.toList());
    
    // 4. XÓA trước và FLUSH để đảm bảo xóa được commit
    if (!toDelete.isEmpty()) {
        visibilityRepository.deleteAll(toDelete);
        visibilityRepository.flush(); // ⭐ KEY FIX: Flush trước khi insert
    }
    
    // 5. THÊM mới sau
    if (!toAdd.isEmpty()) {
        // ... saveAll(visibilities)
    }
}
```

### Lợi ích của giải pháp

✅ **Tránh duplicate key constraint**: Chỉ xóa những gì cần xóa, flush trước khi insert  
✅ **Hiệu suất tốt hơn**: Không xóa và tạo lại toàn bộ (chỉ update diff)  
✅ **Giữ nguyên ID và timestamp**: Records không thay đổi sẽ giữ nguyên  
✅ **An toàn hơn**: Tránh race condition trong transaction  

## Files đã được sửa (Modified Files)

### `ContentVisibilityService.java`

Đã cập nhật 4 methods:
1. ✅ `updateSectionVisibility()` - Line 31-86
2. ✅ `updateLessonVisibility()` - Line 127-182
3. ✅ `updateQuizVisibility()` - Line 222-277
4. ✅ `updateAssignmentVisibility()` - Line 317-372

Tất cả đều áp dụng cùng một pattern:
- Fetch existing records
- Calculate diff (toDelete, toAdd)
- Delete first with flush
- Insert new records

## Testing

### Test case cần kiểm tra:

1. **Thêm class mới vào section** ✓
   - Chọn "Lớp sáng 01" (đã có)
   - Thêm "Lớp chiều A" (mới)
   - ➡️ Không còn lỗi duplicate key

2. **Xóa class khỏi section** ✓
   - Bỏ chọn một lớp đang hiển thị
   - ➡️ Record bị xóa

3. **Giữ nguyên visibility** ✓
   - Không thay đổi gì
   - ➡️ Không có delete/insert

4. **Chọn tất cả classes** ✓
   - Chọn toàn bộ lớp
   - ➡️ Chỉ thêm các lớp chưa có

5. **Bỏ chọn tất cả** ✓
   - Không chọn lớp nào
   - ➡️ Xóa tất cả visibility

## Lưu ý kỹ thuật (Technical Notes)

### Tại sao phải flush()?

```java
visibilityRepository.deleteAll(toDelete);
visibilityRepository.flush(); // ⭐ BẮT BUỘC
```

- JPA/Hibernate buffer các câu lệnh SQL trong memory
- Trong một transaction, DELETE và INSERT có thể được gửi đến DB cùng lúc
- Flush() **ép buộc** DELETE được thực thi ngay lập tức
- Sau đó mới INSERT → Tránh vi phạm unique constraint

### Alternative Solution (Not Used)

Có thể dùng **MERGE** strategy:
```java
@Modifying
@Query("UPDATE ClassContentVisibility SET isVisible = :visible WHERE ...")
```

**Nhược điểm**: Phức tạp hơn, vẫn cần handle add/remove cases riêng biệt.

## Kết luận (Conclusion)

✅ **Vấn đề đã được giải quyết hoàn toàn**  
✅ **Code an toàn và hiệu quả hơn**  
✅ **Áp dụng đồng nhất cho tất cả content types**  

Nếu gặp lỗi tương tự ở phần khác, áp dụng cùng pattern này.
