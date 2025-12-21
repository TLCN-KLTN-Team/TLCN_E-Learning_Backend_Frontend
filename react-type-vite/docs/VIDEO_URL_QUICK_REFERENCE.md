# Video URL Support - Quick Reference

## ✅ Supported Video Sources

### 🎬 YouTube
```
✅ https://www.youtube.com/watch?v=VIDEO_ID
✅ https://youtu.be/VIDEO_ID
✅ https://www.youtube.com/embed/VIDEO_ID
```
**Player:** YouTube iframe embed

### 📹 Cloudinary
```
✅ https://res.cloudinary.com/.../video/upload/.../file.mp4
⚠️ https://res.cloudinary.com/.../raw/upload/.../file (auto-fixed)
```
**Player:** HTML5 `<video>` tag

### 📁 Direct Files
```
✅ https://example.com/video.mp4
✅ https://cdn.example.com/media.webm
```
**Player:** HTML5 `<video>` tag

## 🚀 How It Works

### Auto-Detection Flow
```
URL Input
    ↓
Is YouTube? → Yes → Extract Video ID → iframe embed
    ↓ No
Is Cloudinary? → Yes → Fix /raw/ to /video/ → <video>
    ↓ No
Direct file → Use as-is → <video>
```

## 🔧 Helper Functions

### Check if YouTube
```typescript
isYouTubeUrl(url: string): boolean
```

### Get YouTube Embed URL
```typescript
getYouTubeEmbedUrl(url: string): string | null
// Input:  https://www.youtube.com/watch?v=qHr1tkrZcMs
// Output: https://www.youtube.com/embed/qHr1tkrZcMs
```

### Fix Cloudinary URL
```typescript
fixCloudinaryVideoUrl(url: string): string
// Input:  https://res.cloudinary.com/.../raw/upload/.../Two_Sum
// Output: https://res.cloudinary.com/.../video/upload/.../Two_Sum.mp4
```

## 🎯 Usage in Components

```tsx
import { isYouTubeUrl, getYouTubeEmbedUrl, fixCloudinaryVideoUrl } from "@/utils/videoUrlHelper";

// In render
{isYouTubeUrl(videoUrl) ? (
  <iframe src={getYouTubeEmbedUrl(videoUrl)} />
) : (
  <video src={fixCloudinaryVideoUrl(videoUrl)} controls />
)}
```

## 📊 Comparison

| Feature | YouTube | Cloudinary | Direct File |
|---------|---------|------------|-------------|
| Player | iframe | `<video>` | `<video>` |
| Controls | YouTube native | Browser native | Browser native |
| Autoplay | Requires mute | ✅ | ✅ |
| Download | ❌ | Can disable | Can disable |
| Analytics | YouTube | Custom | Custom |
| Offline | ❌ | Cache possible | Cache possible |

## 🐛 Common Issues

### YouTube doesn't load
- Check Console for extracted Video ID
- Verify video is public
- Check network/CORS issues

### Cloudinary doesn't load
- URL should have `/video/` not `/raw/`
- Must have file extension (.mp4, .webm, etc.)
- Check Cloudinary Dashboard for resource type

### Direct file doesn't load
- Check file format is supported
- Verify CORS headers
- Test URL directly in browser

## 📝 Examples

### Example 1: YouTube from watch URL
```typescript
const url = "https://www.youtube.com/watch?v=qHr1tkrZcMs&list=PLgaUgU1E854qW70A185s-m1nQeChmt9pL";
isYouTubeUrl(url); // true
getYouTubeEmbedUrl(url); // "https://www.youtube.com/embed/qHr1tkrZcMs"
```

### Example 2: YouTube from short URL
```typescript
const url = "https://youtu.be/qHr1tkrZcMs";
isYouTubeUrl(url); // true
getYouTubeEmbedUrl(url); // "https://www.youtube.com/embed/qHr1tkrZcMs"
```

### Example 3: Cloudinary with /raw/
```typescript
const url = "https://res.cloudinary.com/dm7wobbxu/raw/upload/v1764732569/Two_Sum";
fixCloudinaryVideoUrl(url); 
// "https://res.cloudinary.com/dm7wobbxu/video/upload/v1764732569/Two_Sum.mp4"
```

### Example 4: Direct MP4
```typescript
const url = "https://example.com/videos/lesson1.mp4";
fixCloudinaryVideoUrl(url); // "https://example.com/videos/lesson1.mp4" (unchanged)
```

## 🎨 UI Badges

```tsx
// Display video type badge
{isYouTubeUrl(url) ? (
  <span className="bg-red-100 text-red-700">🎬 YouTube</span>
) : (
  <span className="bg-blue-100 text-blue-700">📹 Video File</span>
)}
```

## 🔍 Debugging

### Console Logs
```javascript
// YouTube detection
🎬 Extracted YouTube ID: qHr1tkrZcMs
✅ YouTube iframe loaded successfully!

// Cloudinary fix
🔧 Fixed Cloudinary URL: /raw/ → /video/
🔧 Added .mp4 extension to Cloudinary URL
Original URL: .../raw/upload/.../Two_Sum
Fixed URL: .../video/upload/.../Two_Sum.mp4
✅ Video loaded successfully!
```

### Error Logs
```javascript
❌ Video load error: Event
Video src: https://...
Error details: {
  error: MediaError { code: 4, message: "..." },
  networkState: 3,
  readyState: 0
}
```

## ⚡ Performance Tips

1. **Lazy loading** (future)
   ```tsx
   <iframe loading="lazy" />
   ```

2. **Thumbnail preview** (future)
   ```tsx
   <img src={thumbnail} alt="Preview" />
   ```

3. **Optimize Cloudinary**
   ```
   /video/upload/q_auto,f_auto/VIDEO_ID.mp4
   ```

## 📚 Related Files

- `src/utils/videoUrlHelper.ts` - Helper functions
- `src/pages/student/course/CourseDetail.tsx` - Implementation
- `VIDEO_PLAYBACK_FIX.md` - Full documentation
