# Group API Implementation

## Tổng quan

Đã triển khai đầy đủ các API functions để quản lý groups trong workspace, bao gồm tạo group, tìm kiếm thành viên và hiển thị danh sách groups.

## Các thay đổi chính

### 1. Group API Functions (`src/services/api/workspace/group.api.ts`)

#### `getAllGroupsByChannelId(channelId: string)`

- **Endpoint**: `GET /server/groups/{channelId}`
- **Mục đích**: Lấy danh sách tất cả các groups trong một channel
- **Return**: `Promise<GroupResponse[]>`

#### `getMembersInChannelByMssv(channelId: string, keyword: string)`

- **Endpoint**: `GET /server/groups/members/{channelId}?keyword={keyword}`
- **Mục đích**: Tìm kiếm thành viên trong channel theo MSSV
- **Return**: `Promise<UserProfileResponse[]>`

#### `createGroup(request: CreateGroupRequest)`

- **Endpoint**: `POST /server/groups`
- **Mục đích**: Tạo một group mới
- **Body**:
  ```typescript
  {
    channelId: string;
    name: string;
    description?: string;
    memberIds: string[];
  }
  ```
- **Return**: `Promise<GroupResponse>`

### 2. Types (`src/types/chat.types.ts`)

#### Thêm type mới:

```typescript
export interface UserProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  mssv: string;
  avatar?: string | null;
}
```

### 3. AddGroupModal Component

**Cập nhật:**

- Sử dụng `getMembersInChannelByMssv()` thay vì `getStudentsByMSSV()` để tìm kiếm thành viên trong channel cụ thể
- Sử dụng `createGroup()` API thực tế thay vì mock data
- Tự động convert `UserProfileResponse` sang `UserResponse` format

**Lưu ý:**

- Chỉ hiển thị các thành viên có trong channel đó
- Validate ít nhất 1 thành viên khi tạo group

### 4. ChannelPanel Component

**Cập nhật:**

- Import và sử dụng `getAllGroupsByChannelId()`
- Tự động fetch groups cho mỗi channel khi load workspace
- Hiển thị groups dưới mỗi channel với khả năng expand/collapse

**Flow:**

1. Khi workspace được chọn → Fetch tất cả channels
2. Cho mỗi channel → Fetch danh sách groups
3. Cập nhật state với channels bao gồm groups
4. ChannelList component hiển thị với expand/collapse functionality

### 5. ChannelList Component (Đã có sẵn)

**Tính năng:**

- Hiển thị danh sách channels
- Nút expand/collapse để xem/ẩn groups
- Icons hành động (UserPlus, FolderPlus) xuất hiện khi hover
- Tích hợp với GroupList component

### 6. GroupList Component (Đã có sẵn)

**Tính năng:**

- Hiển thị danh sách groups dưới mỗi channel
- Cho phép chọn group
- Hiển thị số lượng thành viên trong group
- Indentation để phân biệt với channels

## Cách sử dụng

### Tạo Group mới:

1. Hover vào channel → Nhấn icon FolderPlus
2. Nhập tên group và mô tả
3. Tìm kiếm và thêm thành viên (tối thiểu 1 người)
4. Nhấn "Tạo Nhóm"

### Xem Groups:

1. Nhấn mũi tên expand/collapse bên cạnh channel name
2. Danh sách groups sẽ hiển thị với indentation
3. Nhấn vào group để chọn (nếu cần)

## API Backend Requirements

Backend cần đảm bảo các endpoints sau hoạt động:

```
GET  /server/groups/{channelId}
GET  /server/groups/members/{channelId}?keyword={keyword}
POST /server/groups
```

## Response Types

### GroupResponse:

```typescript
{
  id: string;
  groupName: string;
  channelId: string;
  description?: string;
  participants?: Participant[];
  createdDate?: string;
}
```

### CreateGroupResponse (Backend trả về GroupResponse):

```typescript
{
  groupId: string; // Mapped to id
  groupName: string;
}
```

## Lỗi thường gặp và xử lý

1. **Không tìm thấy thành viên**: Kiểm tra channelId có đúng không
2. **Không tạo được group**: Kiểm tra memberIds có tồn tại trong channel không
3. **Groups không hiển thị**: Kiểm tra API endpoint `/server/groups/{channelId}` có trả về data đúng không

## Testing

Để test các tính năng:

1. Chọn một workspace
2. Kiểm tra channels có hiển thị với nút expand/collapse
3. Click nút FolderPlus để mở AddGroupModal
4. Tìm kiếm thành viên bằng MSSV
5. Tạo group và verify group xuất hiện trong danh sách
