# Channel Visibility Authorization (UC-42)

## Vấn đề

Trước khi có thay đổi này, endpoint `GET /channels/list/section/{sectionId}` trả về **toàn bộ** danh sách channel trong một section cho mọi người dùng, không phân biệt họ có thuộc channel đó hay không.

Điều này dẫn đến sinh viên có thể thấy các channel nhóm khác trong cùng section — vi phạm nguyên tắc phân quyền của bài tập nhóm.

---

## Phân tích entity

```
Workspace
  └─ Section           { sectionMembers: [userId, ...] }   ← denormalized array
       └─ Channel       { memberCount: int }                ← chỉ lưu count
            └─ ChannelMember  (collection riêng)
                 { channelId, sectionId, userId, role, status }
```

**Điểm quan trọng:**

- `ChannelMember` là **collection độc lập** (`channel_members`), không embed vào Channel.
- Compound index `(sectionId, userId)` đã tồn tại trên collection này.
- `ChannelRole` phân biệt `TEACHER` và `STUDENT` tại tầng channel member.
- JWT của người dùng chứa claim `roles` (e.g. `["TEACHER"]` hoặc `["STUDENT"]`), được Spring Security đọc và thêm prefix `ROLE_`.

---

## Hướng cài đặt chọn: Backend filter tại service layer (Hướng B)

### Tại sao chọn Hướng B?

| Hướng | Mô tả | Vấn đề |
|---|---|---|
| A — Frontend filtering | Gọi `/members/{channelId}` cho mỗi channel rồi lọc | N+1 API calls; hiệu suất tệ |
| **B — Backend service filter** | Service đọc role từ JWT, trả về danh sách đã lọc | **2 queries có index; không đổi frontend** |
| C — Dedicated endpoint | Tạo endpoint mới riêng cho student | Cần thay đổi cả frontend |

Hướng B được chọn vì:
- Dùng index `(sectionId, userId)` đã có sẵn → O(log n)
- Không cần thay đổi frontend (cùng endpoint, cùng response shape)
- Logic phân quyền tập trung một chỗ trong service

---

## Luồng xử lý sau khi thay đổi

```
GET /channels/list/section/{sectionId}
        │
        ▼
ChannelController.getListBasicChannelBySectionId()
        │
        ▼
ChannelServiceImpl.getBasicChannels(sectionId)
        │
        ├─ Đọc JWT từ SecurityContextHolder
        │       Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        │       String userId = auth.getName();           // sub claim = userId
        │
        ├─ Kiểm tra role từ authorities (JWT claim "roles" + prefix "ROLE_")
        │       boolean isTeacher = auth.getAuthorities().stream()
        │               .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));
        │
        ├─ [TEACHER] → channelRepository.findAllBySectionId(sectionId)
        │       Trả về TẤT CẢ channels trong section (1 query)
        │
        └─ [STUDENT / MODERATOR] →
                Query 1: channelMemberRepository.findActiveMembershipsBySectionAndUser(sectionId, userId)
                         ↳ index: (sectionId, userId) trên channel_members
                         ↳ filter: status = "ACTIVE"
                Query 2: channelRepository.findAllById(channelIds)
                         ↳ primary key lookup
                Trả về CHỈ channels mà user có ChannelMember ACTIVE
```

---

## Độ phức tạp query

| Role | Số queries | Index sử dụng |
|---|---|---|
| TEACHER | 1 | `(sectionId)` trên `channels` |
| STUDENT | 2 | `(sectionId, userId)` trên `channel_members` + PK trên `channels` |

Cả 2 path đều là O(log n) — không có full collection scan.

---

## Thay đổi code

### File sửa: `ChannelServiceImpl.java`

**Trước:**
```java
@Override
public List<BasicChannelResponse> getBasicChannels(String sectionId) {
    List<Channel> channelList = channelRepository.findAllBySectionId(sectionId);
    return channelList.stream()
            .map(channelMapper::toBasicChannelResponse)
            .toList();
}
```

**Sau:**
```java
@Override
public List<BasicChannelResponse> getBasicChannels(String sectionId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String userId = auth.getName();

    boolean isTeacher = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));

    List<Channel> channelList;
    if (isTeacher) {
        channelList = channelRepository.findAllBySectionId(sectionId);
    } else {
        List<String> channelIds = channelMemberService.getChannelIdsForUserInSection(sectionId, userId);
        channelList = channelRepository.findAllById(channelIds);
    }

    return channelList.stream()
            .map(channelMapper::toBasicChannelResponse)
            .toList();
}
```

### Các thành phần đã có sẵn, không cần tạo mới

| Thành phần | File | Mô tả |
|---|---|---|
| `findActiveMembershipsBySectionAndUser()` | `ChannelMemberRepository.java:50` | `@Query` dùng index `(sectionId, userId, status)` |
| `getChannelIdsForUserInSection()` | `ChannelMemberServiceImpl.java:310` | Wrap repository → trả `List<String>` channelIds |
| `findAllBySectionId()` | `ChannelRepository.java` | Lấy tất cả channel của section |
| `findAllById()` | Spring Data MongoDB built-in | Multi-get theo primary key |

---

## Quy tắc phân quyền đầy đủ

| Role trong JWT | Thấy channel nào |
|---|---|
| `ROLE_TEACHER` | Tất cả channels trong section (MAIN + mọi GROUP) |
| `ROLE_STUDENT` | Chỉ channels có bản ghi `ChannelMember` với `status = ACTIVE` và `userId` khớp |
| `ROLE_MODERATOR` | Như STUDENT — chỉ channels họ là thành viên |

**Khi nào sinh viên được add vào channel:**
- **MAIN channel**: tự động khi enroll vào section (qua Kafka event `STUDENTS_ENROLLED`)
- **GROUP channel**: khi giáo viên tạo nhóm bài tập (`/channels/bulk-random`), mỗi sinh viên được assign vào đúng một nhóm

---

## Ví dụ kịch bản

**Section có:** 1 MAIN channel + 3 GROUP channels (Nhóm 1, 2, 3)

| Người dùng | Role | Thấy |
|---|---|---|
| Giảng viên | TEACHER | MAIN + Nhóm 1 + Nhóm 2 + Nhóm 3 |
| Sinh viên A (Nhóm 1) | STUDENT | MAIN + Nhóm 1 |
| Sinh viên B (Nhóm 2) | STUDENT | MAIN + Nhóm 2 |
| Sinh viên C (Nhóm 3) | STUDENT | MAIN + Nhóm 3 |

---

## Liên quan

- `ChannelServiceImpl.java` — `getChannels()` (line 478): method tương tự trả về `ChannelResponse` với messages, đã filter theo membership từ trước.
- `SecurityConfig.java` — cấu hình `jwtGrantedAuthoritiesConverter` đọc claim `roles` với prefix `ROLE_`.
- `WebSocketAuthChannelInterceptor.java` — lưu token vào `ThreadLocal` cho Feign calls trong WebSocket context.
