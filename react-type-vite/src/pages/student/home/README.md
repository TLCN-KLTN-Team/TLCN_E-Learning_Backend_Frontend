# Home Page Components

## Cấu trúc Components

### 1. Header Component (`/components/student/shared/Header.tsx`)

- Header với navigation menu
- Theme switcher với icon Sun/Moon/Monitor
- Responsive mobile menu
- Dark/Light mode toggle

### 2. HeroSection Component (`/components/student/home/HeroSection.tsx`)

- Phần hero chính của trang
- Gradient background với decorative elements
- Call-to-action button
- Responsive design

### 3. SubjectsSection Component (`/components/student/home/SubjectsSection.tsx`)

- Hiển thị danh sách các môn học
- Grid layout responsive
- Hover effects với animation
- Color-coded categories

### 4. Footer Component (`/components/student/shared/Footer.tsx`)

- Footer với links và newsletter signup
- Social media links
- Copyright information

### 5. BackToTop Component (`/components/ui/BackToTop.tsx`)

- Floating back-to-top button
- Appears after scrolling down 300px
- Smooth scroll animation

## Tính năng đã implement

- ✅ Dark/Light theme switching với icons trực quan
- ✅ Responsive design cho mobile và desktop
- ✅ Modern Tailwind CSS styling
- ✅ Smooth animations và transitions
- ✅ Proper TypeScript typing
- ✅ Component-based architecture
- ✅ Accessible design với ARIA labels

## Theme System

Theme system hỗ trợ 3 modes:

- **Light**: Chế độ sáng với icon Sun ☀️
- **Dark**: Chế độ tối với icon Moon 🌙
- **Auto**: Tự động theo system với icon Monitor 🖥️

Theme được lưu trong localStorage và persist sau khi refresh.
