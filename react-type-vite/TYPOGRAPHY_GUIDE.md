# Typography & Font System - Education 4All

## 📝 Tổng quan

Hệ thống typography được thiết kế đặc biệt cho nền tảng e-learning dành cho sinh viên và giáo viên trẻ, tập trung vào tính dễ đọc, hiện đại và thân thiện.

## 🎨 Google Fonts được sử dụng

### 1. **Inter** - Font chính

- **Mục đích**: Văn bản nội dung, paragraph, body text
- **Đặc điểm**:
  - Thiết kế tối ưu cho màn hình
  - Dễ đọc ở nhiều kích cỡ khác nhau
  - Hỗ trợ tiếng Việt tốt
- **Font weights**: 300, 400, 500, 600, 700

### 2. **Poppins** - Font tiêu đề

- **Mục đích**: Headings, tiêu đề, call-to-action
- **Đặc điểm**:
  - Hiện đại, năng động
  - Phù hợp với người trẻ
  - Tạo cảm giác thân thiện, dễ tiếp cận
- **Font weights**: 300, 400, 500, 600, 700, 800

### 3. **JetBrains Mono** - Font monospace

- **Mục đích**: Code blocks, inline code
- **Đặc điểm**:
  - Thiết kế dành cho lập trình viên
  - Dễ phân biệt ký tự
  - Hỗ trợ ligatures
- **Font weights**: 400, 500, 600

## 🎯 Cách sử dụng

### Typography Classes

#### Headings

```html
<h1 class="heading-hero">Hero Title</h1>
<h1 class="heading-1">Main Title</h1>
<h2 class="heading-2">Section Title</h2>
<h3 class="heading-3">Subsection Title</h3>
<h4 class="heading-4">Small Title</h4>
<h5 class="heading-5">Label Title</h5>
<h6 class="heading-6">Mini Title</h6>
```

#### Body Text

```html
<p class="body-large">Large body text</p>
<p class="body-base">Standard body text</p>
<p class="body-small">Small body text</p>
<p class="body-xs">Extra small text</p>
<p class="caption">Caption text</p>
```

#### Code

```html
<code class="code-inline">inline code</code>
<pre class="code-block">
function example() {
  return "code block";
}
</pre>
```

#### Links

```html
<a href="#" class="link-primary">Primary link</a>
<a href="#" class="link-secondary">Secondary link</a>
```

#### Labels

```html
<span class="label-base">Base label</span>
<span class="label-small">SMALL LABEL</span>
```

### Tailwind Font Classes

```html
<!-- Primary font (Inter) -->
<div class="font-sans">Content text</div>

<!-- Heading font (Poppins) -->
<div class="font-heading">Heading text</div>

<!-- Monospace font (JetBrains Mono) -->
<div class="font-mono">Code text</div>
```

## 🎨 Utility Classes

### Text Effects

```html
<h1 class="text-gradient">Gradient text effect</h1>
<h1 class="text-gradient-warm">Warm gradient effect</h1>
<h1 class="text-shadow">Text with shadow</h1>
<h1 class="text-shadow-lg">Text with large shadow</h1>
```

### Text Wrapping

```html
<p class="text-balance">Balanced text wrapping</p>
<p class="text-pretty">Pretty text wrapping</p>
```

## 🌈 Color System

### Education Theme Colors

- **Primary**: Blue (#3b82f6) - Chính, tin cậy
- **Secondary**: Green (#22c55e) - Thành công, tích cực
- **Accent**: Orange (#f97316) - Nổi bật, thu hút
- **Purple**: Purple (#8b5cf6) - Sáng tạo, đổi mới

### Usage Examples

```html
<button class="bg-blue-600 text-white">Primary Button</button>
<span class="bg-green-100 text-green-800">Success Badge</span>
<div class="border-orange-200 bg-orange-50">Warning Card</div>
```

## 📱 Responsive Design

Typography tự động điều chỉnh trên các thiết bị:

- **Desktop**: Kích thước đầy đủ
- **Tablet (768px)**: Giảm 10-15% kích thước
- **Mobile (480px)**: Giảm 20-25% kích thước

## 🎨 Best Practices

### 1. Hierarchy rõ ràng

- Sử dụng `heading-hero` cho tiêu đề chính
- `heading-1` cho tiêu đề section
- `heading-2,3,4` cho subsections
- `body-base` cho nội dung chính

### 2. Contrast và Accessibility

- Đảm bảo contrast ratio >= 4.5:1
- Sử dụng `text-gray-600` cho secondary text
- `caption` cho thông tin phụ

### 3. Spacing

- Sử dụng `space-y-*` cho vertical spacing
- `mb-*` cho margin bottom của headings
- Giữ rhythm tutorialô with line-height

### 4. Performance

- Fonts được preload trong HTML
- Sử dụng `font-display: swap`
- Optimize với subset cho tiếng Việt

## 🔧 Customization

### Thêm font weights mới

Cập nhật trong `tailwind.config.js`:

```javascript
fontFamily: {
  sans: ['Inter', ...],
  heading: ['Poppins', ...],
}
```

### Tùy chỉnh font sizes

```javascript
fontSize: {
  'custom': ['1.375rem', { lineHeight: '1.6' }],
}
```

## 📋 Component Examples

Xem file `TypographyDemo.tsx` để xem các ví dụ thực tế về:

- Course cards
- Form layouts
- Navigation menus
- Content sections

## 🚀 Getting Started

1. Fonts đã được import trong `index.html`
2. Styles được thiết lập trong `src/styles/typography.css`
3. Tailwind config đã được cấu hình trong `tailwind.config.js`
4. Sử dụng các classes trong components của bạn

Chúc bạn thiết kế thành công! 🎉
