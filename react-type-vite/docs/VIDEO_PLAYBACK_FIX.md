# Video Playback Fix Guide

## Vấn đề (Problem)

Video không phát được trong Course Detail page của Student, support cả **YouTube** và **Cloudinary**.

## Các loại URL được hỗ trợ

### 1. YouTube URLs ✅
```
✅ https://www.youtube.com/watch?v=qHr1tkrZcMs&list=PLgaUgU1E854qW70A185s-m1nQeChmt9pL
✅ https://youtu.be/qHr1tkrZcMs
✅ https://www.youtube.com/embed/qHr1tkrZcMs
✅ https://www.youtube.com/v/qHr1tkrZcMs
```

**Giải pháp**: Tự động convert sang YouTube embed iframe
```
→ https://www.youtube.com/embed/qHr1tkrZcMs
```

### 2. Cloudinary URLs ✅
```
❌ BAD:  https://res.cloudinary.com/dm7wobbxu/raw/upload/v1764732569/Two_Sum
✅ GOOD: https://res.cloudinary.com/dm7wobbxu/video/upload/v1764732569/Two_Sum.mp4
```

**Giải pháp**: Tự động fix `/raw/` → `/video/` và thêm `.mp4` extension

### 3. Direct Video URLs ✅
```
✅ https://example.com/video.mp4
✅ https://cdn.example.com/media/lesson1.webm
```

**Giải pháp**: Sử dụng trực tiếp với `<video>` tag

## Giải pháp đã áp dụng

### 1. Video URL Helper (`videoUrlHelper.ts`)

#### Detect YouTube
```typescript
export const isYouTubeUrl = (url: string): boolean => {
  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url);
};
```

#### Extract YouTube Video ID
```typescript
export const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,    // watch?v=VIDEO_ID
    /(?:youtube\.com\/embed\/)([^?&\s]+)/,      // embed/VIDEO_ID
    /(?:youtu\.be\/)([^?&\s]+)/,                // youtu.be/VIDEO_ID
    /(?:youtube\.com\/v\/)([^?&\s]+)/,          // v/VIDEO_ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  
  return null;
};
```

#### Convert to Embed URL
```typescript
export const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};
```

#### Fix Cloudinary URL
```typescript
export const fixCloudinaryVideoUrl = (url: string): string => {
  // Convert /raw/ to /video/
  // Add .mp4 extension if missing
};
```

### 2. Updated CourseDetail.tsx

```tsx
import { fixCloudinaryVideoUrl, isYouTubeUrl, getYouTubeEmbedUrl } from "@/utils/videoUrlHelper";

// Render video
{isYouTubeUrl(lesson.videoUrl) ? (
  // YouTube iframe
  <iframe
    src={getYouTubeEmbedUrl(lesson.videoUrl) || ''}
    className="w-full h-full"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
) : (
  // Regular video file
  <video
    src={fixCloudinaryVideoUrl(lesson.videoUrl)}
    controls
  />
)}
```

### 3. UI Features

- ✅ Hiển thị loại video (YouTube 🎬 hoặc Video File 📹)
- ✅ Show URL gốc và URL đã xử lý
- ✅ Debug logging trong Console
- ✅ Responsive aspect ratio (16:9)
- ✅ Error handling

## Cách kiểm tra (Testing)

### Test YouTube URL

1. **Input URL:**
   ```
   https://www.youtube.com/watch?v=qHr1tkrZcMs&list=PLgaUgU1E854qW70A185s-m1nQeChmt9pL
   ```

2. **Console Log:**
   ```
   🎬 Extracted YouTube ID: qHr1tkrZcMs
   ✅ YouTube iframe loaded successfully!
   ```

3. **UI Display:**
   - Badge: `🎬 YouTube`
   - Embed URL: `https://www.youtube.com/embed/qHr1tkrZcMs`
   - YouTube player với controls

### Test Cloudinary URL

1. **Input URL:**
   ```
   https://res.cloudinary.com/dm7wobbxu/raw/upload/v1764732569/Two_Sum
   ```

2. **Console Log:**
   ```
   🔧 Fixed Cloudinary URL: /raw/ → /video/
   🔧 Added .mp4 extension to Cloudinary URL
   ✅ Video loaded successfully!
   ```

3. **UI Display:**
   - Badge: `📹 Video File`
   - Fixed URL: `https://res.cloudinary.com/dm7wobbxu/video/upload/v1764732569/Two_Sum.mp4`
   - HTML5 video player

### Test Direct Video URL

1. **Input URL:**
   ```
   https://example.com/video.mp4
   ```

2. **Result:**
   - Badge: `📹 Video File`
   - HTML5 video player
   - No URL transformation

## Supported Video Sources

| Source | Status | Player | Notes |
|--------|--------|--------|-------|
| YouTube | ✅ | iframe | Auto-detect và convert to embed |
| Cloudinary | ✅ | `<video>` | Auto-fix /raw/ và extension |
| Direct MP4 | ✅ | `<video>` | Native support |
| Direct WebM | ✅ | `<video>` | Native support |
| Vimeo | ❌ | - | Chưa support (có thể thêm) |
| Facebook | ❌ | - | Chưa support |

## Troubleshooting

### YouTube không load

**Nguyên nhân:**
- Blocked by CORS
- Video bị private/restricted
- Network error

**Giải pháp:**
```typescript
// Check Console logs
console.log('YouTube ID:', getYouTubeVideoId(url));
console.log('Embed URL:', getYouTubeEmbedUrl(url));

// Try URL trực tiếp trong browser
// https://www.youtube.com/embed/VIDEO_ID
```

### Cloudinary video không load

**Nguyên nhân:**
- Sai resource type (/raw/ thay vì /video/)
- Thiếu file extension
- File không tồn tại

**Giải pháp:**
```typescript
// Helper đã tự động fix
fixCloudinaryVideoUrl(url)

// Kiểm tra trong Cloudinary Dashboard:
// - Resource type phải là "video"
// - Public ID phải đúng
```

### Video load chậm

**Solutions:**
1. **Enable lazy loading** (có thể thêm)
2. **Use thumbnail preview**
3. **Optimize Cloudinary:**
   ```
   /video/upload/q_auto,f_auto/VIDEO_ID.mp4
   ```

## YouTube Embed Options

### Basic Embed
```typescript
`https://www.youtube.com/embed/${videoId}`
```

### With Parameters (có thể custom)
```typescript
`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`
```

**Useful parameters:**
- `autoplay=1` - Auto play video
- `mute=1` - Mute audio (required for autoplay)
- `rel=0` - Hide related videos
- `controls=0` - Hide controls
- `start=30` - Start at 30 seconds
- `end=90` - End at 90 seconds

## Future Enhancements

### 1. Support Vimeo
```typescript
export const isVimeoUrl = (url: string): boolean => {
  return /vimeo\.com\/(\d+)/i.test(url);
};

export const getVimeoEmbedUrl = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}`;
};
```

### 2. Video Thumbnail Preview
```tsx
<div className="relative">
  <img src={thumbnail} alt="Video preview" />
  <PlayButton onClick={handlePlay} />
</div>
```

### 3. Progress Tracking
```tsx
<video
  onTimeUpdate={(e) => {
    const progress = (e.currentTarget.currentTime / e.currentTarget.duration) * 100;
    updateProgress(progress);
  }}
/>
```

## Files Modified

✅ **Frontend:**
- `src/utils/videoUrlHelper.ts` (UPDATED - Added YouTube support)
- `src/pages/student/course/CourseDetail.tsx` (UPDATED - Conditional rendering)

## Kết luận

✅ **Support đa nền tảng:**
- YouTube (iframe embed)
- Cloudinary (auto-fix URL)
- Direct video files (native player)

✅ **Smart Detection:**
- Tự động nhận dạng loại video
- Chọn player phù hợp
- Fix URL issues

✅ **User Experience:**
- Seamless playback
- Debug information
- Error handling

✅ **Extensible:**
- Dễ dàng thêm Vimeo, Facebook, etc.
- Custom player options
- Progress tracking ready
