# Quick Start - Elasticsearch Search Improvements

## 🚀 Bắt đầu nhanh (3 bước)

### Bước 1: Reindex dữ liệu

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:8084/api/admin/elasticsearch/reindex-courses" -Method POST
```

**Curl:**

```bash
curl -X POST "http://localhost:8084/api/admin/elasticsearch/reindex-courses"
```

### Bước 2: Kiểm tra trạng thái

```powershell
Invoke-RestMethod -Uri "http://localhost:8084/api/admin/elasticsearch/index/status" -Method GET
```

Kết quả mong đợi:

```json
{
  "code": 200,
  "message": "Index status retrieved successfully",
  "result": {
    "indexName": "published_courses",
    "exists": true,
    "documentCount": 100,
    "databaseCount": 100,
    "inSync": true
  }
}
```

### Bước 3: Test tìm kiếm

**Test với script tự động:**

```powershell
.\test-elasticsearch-search.ps1
```

**Hoặc test thủ công:**

```powershell
$body = @{
    keyword = "Công nghệ thông tin"
    page = 0
    size = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8084/api/public/courses/search" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

## ✅ Checklist triển khai

- [ ] Đã reindex dữ liệu
- [ ] Index status = in sync
- [ ] Test tìm kiếm exact match
- [ ] Test tìm kiếm với filter
- [ ] Kiểm tra kết quả chính xác hơn trước

---

## 🎯 Kết quả mong đợi

**Trước:** Tìm "Công nghệ thông tin" → Kết quả lộn xộn, không liên quan  
**Sau:** Tìm "Công nghệ thông tin" → Khóa học chính xác đứng đầu ✅

---

## 📖 Tài liệu đầy đủ

- **Chi tiết cải tiến**: [ELASTICSEARCH_IMPROVEMENTS_SUMMARY.md](ELASTICSEARCH_IMPROVEMENTS_SUMMARY.md)
- **Hướng dẫn reindex**: [ELASTICSEARCH_REINDEX_GUIDE.md](ELASTICSEARCH_REINDEX_GUIDE.md)
- **Script test**: [test-elasticsearch-search.ps1](test-elasticsearch-search.ps1)

---

## 🆘 Troubleshooting nhanh

### Vấn đề: Index không tồn tại

```powershell
# Giải pháp: Khởi động lại service hoặc gọi reindex
Invoke-RestMethod -Uri "http://localhost:8084/api/admin/elasticsearch/reindex-courses" -Method POST
```

### Vấn đề: Kết quả vẫn không chính xác

```powershell
# 1. Kiểm tra mapping
curl -X GET "http://localhost:9200/published_courses/_mapping"

# 2. Xóa và reindex lại
curl -X DELETE "http://localhost:9200/published_courses"
Invoke-RestMethod -Uri "http://localhost:8084/api/admin/elasticsearch/reindex-courses" -Method POST
```

### Vấn đề: documentCount != databaseCount

```powershell
# Giải pháp: Reindex lại
Invoke-RestMethod -Uri "http://localhost:8084/api/admin/elasticsearch/reindex-courses" -Method POST
```

---

## 💡 Tips

1. **Chạy reindex sau mỗi lần deploy** nếu có thay đổi document structure
2. **Monitor index status** định kỳ để đảm bảo sync
3. **Test với data thực tế** của user để tune boost values
4. **Backup trước khi xóa index** trong production

---

**Ready to go!** 🎉
