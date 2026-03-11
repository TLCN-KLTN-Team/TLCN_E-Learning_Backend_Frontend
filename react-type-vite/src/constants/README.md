# Constants Directory

## Tổng quan

Thư mục này chứa các hằng số (constants) được sử dụng trong toàn bộ ứng dụng để đảm bảo tính nhất quán và dễ bảo trì.

## Files

### 📁 routes.ts

**Mục đích**: Quản lý tập trung tất cả các routes trong ứng dụng

**Nội dung**:

- Static routes (routes tĩnh không có tham số)
- Dynamic route generators (hàm tạo routes với tham số)
- Route patterns (cho React Router path definitions)

**Cách sử dụng**:

```typescript
import { PUBLIC_ROUTES, STUDENT_ROUTES, createRoute } from "@/constants/routes";

// Static route
<Link to={PUBLIC_ROUTES.HOME}>Trang chủ</Link>

// Dynamic route
<Link to={createRoute.courseDetail(123)}>Xem khóa học</Link>
```

**Documentation**: Xem [ROUTE_CONSTANTS_GUIDE.md](../docs/ROUTE_CONSTANTS_GUIDE.md)

### 📁 routes.examples.tsx

**Mục đích**: Cung cấp ví dụ thực tế về cách sử dụng route constants

**Nội dung**:

- Các component ví dụ sử dụng route constants
- Navigation patterns
- Programmatic navigation
- Conditional routing
- Utility functions

**Sử dụng**: File này chỉ để tham khảo, không import vào production code

### 📁 courseStyle.ts

**Mục đích**: Quản lý các style constants cho courses (có sẵn từ trước)

## Best Practices

### 1. Thêm Constants Mới

Khi thêm constants mới:

1. Đặt tên rõ ràng, theo ngữ cảnh
2. Group theo tính năng hoặc module
3. Export dưới dạng `as const` để type safety
4. Document usage nếu phức tạp

### 2. Sử dụng Constants

✅ **Nên:**

- Import constants cần thiết
- Sử dụng destructuring để code ngắn gọn
- Prefer constants hơn magic strings/numbers

❌ **Không nên:**

- Hardcode values trong code
- Tạo duplicated constants
- Sử dụng magic numbers

### 3. Maintain và Update

- Cập nhật documentation khi thay đổi
- Kiểm tra usages trước khi xóa constants
- Version breaking changes properly

## Conventions

### Naming

- **UPPER_SNAKE_CASE**: cho constants objects/enums
- **camelCase**: cho functions và helper methods
- **PascalCase**: cho type/interface trong constants

### Grouping

- Group theo feature/domain
- Tạo file riêng nếu một group quá lớn
- Maintain index exports cho easy imports

### Documentation

- Thêm JSDoc comments cho complex constants
- Cung cấp examples cho non-trivial usage
- Link đến related documentation

## Migration

Khi migrate từ hardcoded values sang constants:

1. **Tìm tất cả hardcoded values**

   ```bash
   # Search for hardcoded routes
   grep -r "href=\"/" src/
   grep -r "to=\"/" src/
   ```

2. **Replace từng cái một**
   - Test sau mỗi replacement
   - Update imports
   - Check for type errors

3. **Verify functionality**
   - Test navigation
   - Check console for errors
   - Validate with end-to-end tests

## Future Enhancements

Potential improvements:

- [ ] API endpoints constants
- [ ] Environment-specific constants
- [ ] Theme/style constants consolidation
- [ ] Localization keys constants
- [ ] Feature flags constants

## Related Documentation

- [Route Constants Guide](../docs/ROUTE_CONSTANTS_GUIDE.md) - Chi tiết về sử dụng route constants
- [Architecture Decision Records](../docs/ADR.md) - Các quyết định kiến trúc (nếu có)
