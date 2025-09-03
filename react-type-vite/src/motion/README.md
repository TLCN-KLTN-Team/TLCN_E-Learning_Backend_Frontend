# Motion Animation System

Hệ thống animation được tạo với Framer Motion cho ứng dụng E-Learning, cung cấp các components có thể tái sử dụng và hiệu ứng mượt mà.

## 📁 Cấu trúc thư mục

```
src/motion/
├── index.ts                    # Export tất cả components và utilities
├── variants.ts                 # Animation variants definitions
├── AnimatedComponents.tsx      # Reusable animated wrapper components
├── InteractiveComponents.tsx   # Interactive hover/click components
└── utils.ts                   # Utility functions và presets
```

## 🎯 Components được tạo

### 1. **Animated Wrapper Components**

- `FadeInUp` - Fade in từ dưới lên
- `FadeInDown` - Fade in từ trên xuống
- `FadeInLeft` - Fade in từ trái sang phải
- `FadeInRight` - Fade in từ phải sang trái
- `ScaleIn` - Scale in animation
- `StaggerContainer` - Container cho stagger animation
- `AnimatedSection` - Generic animated section wrapper

### 2. **Interactive Components**

- `HoverScale` - Scale effect khi hover
- `AnimatedButton` - Button với click animation
- `HoverCard` - Card hover effects
- `FloatingElement` - Floating animation
- `RotatingElement` - Rotating animation
- `PulseElement` - Pulse animation

### 3. **Animation Variants**

- `fadeInUpVariant` - Cơ bản fade in up
- `fadeInDownVariant` - Fade in down
- `fadeInLeftVariant` - Fade in left
- `fadeInRightVariant` - Fade in right
- `scaleInVariant` - Scale in
- `staggerContainerVariant` - Stagger container
- `staggerItemVariant` - Stagger item
- **Hero Section Variants:**
  - `heroTitleVariant` - Animation cho hero title
  - `heroSubtitleVariant` - Animation cho hero subtitle
  - `heroButtonVariant` - Animation cho hero button
  - `heroImageVariant` - Animation cho hero image
- `floatingVariant` - Floating animation
- `rotateVariant` - Rotate animation

## 🚀 Sử dụng

### Import components:

```tsx
import {
  FadeInUp,
  FadeInLeft,
  AnimatedSection,
  HoverScale,
  AnimatedButton,
} from "@/motion";
```

### Ví dụ sử dụng:

#### 1. Basic Fade In Animation:

```tsx
<FadeInUp delay={0.2}>
  <h1>Animated Title</h1>
</FadeInUp>
```

#### 2. Stagger Animation:

```tsx
<StaggerContainer>
  {items.map((item, index) => (
    <FadeInUp key={index} delay={index * 0.1}>
      <div>{item}</div>
    </FadeInUp>
  ))}
</StaggerContainer>
```

#### 3. Interactive Components:

```tsx
<HoverScale>
  <button>Hover me!</button>
</HoverScale>

<AnimatedButton>
  <Button>Click me!</Button>
</AnimatedButton>
```

#### 4. Section Animation:

```tsx
<AnimatedSection variant="fadeInUp" className="py-12">
  <div>Animated section content</div>
</AnimatedSection>
```

## ⚡ Tính năng chính

### 1. **Viewport Detection**

- Animations chỉ trigger khi elements vào viewport
- Sử dụng `whileInView` và `viewport={{ once: true, amount: 0.3 }}`

### 2. **Customizable Timing**

- `delay` prop để tạo stagger effects
- `duration` prop để control animation speed

### 3. **Performance Optimized**

- `once: true` để animations chỉ chạy một lần
- Efficient viewport detection

### 4. **TypeScript Support**

- Fully typed interfaces
- IntelliSense support

## 🎨 Animation Examples trong Home.tsx

### Hero Section:

- Title animation với delay
- Subtitle animation
- Button hover effects
- Image slide in animation
- Floating decorative elements

### About Section:

- Image slide in từ trái
- Content slide in từ phải
- List items với stagger animation
- Button hover effects

### Mobile App Section:

- Content animation với stagger
- App store buttons hover effects
- Background decorations

### CTA Section:

- Grid layout với stagger animation
- Card animation
- Button interactions

### Testimonials Section:

- Header animation
- Testimonials slider animation

## 🔧 Configuration

### Default Settings:

```typescript
const defaultViewport = {
  once: true,
  amount: 0.3,
};

const transitions = {
  smooth: { duration: 0.6 },
  quick: { duration: 0.3 },
  slow: { duration: 1.2 },
};
```

## 📝 Best Practices

1. **Sử dụng delays hợp lý** - Tránh delays quá dài
2. **Group related animations** - Sử dụng StaggerContainer cho multiple items
3. **Performance** - Sử dụng `once: true` cho animations không cần repeat
4. **Accessibility** - Respect user's motion preferences
5. **Consistency** - Sử dụng cùng duration và easing cho similar animations

## 🚀 Tương lai

- [ ] Thêm gesture animations
- [ ] SVG path animations
- [ ] Page transition animations
- [ ] Parallax scroll effects
- [ ] Loading animations
- [ ] Micro-interactions

## 📚 Dependencies

- `framer-motion` - Animation library
- `react` - UI framework
- `typescript` - Type safety
