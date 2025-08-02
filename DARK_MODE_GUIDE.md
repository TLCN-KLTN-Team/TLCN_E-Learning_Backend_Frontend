# 🌙 Dark Mode Implementation Guide

## 🎯 Overview

This implementation provides a comprehensive theme system with:

- ✅ **Light Mode**
- ✅ **Dark Mode**
- ✅ **System Mode** (follows OS preference)
- ✅ **No FOUC** (Flash of Unstyled Content)
- ✅ **Bootstrap + Tailwind Integration**
- ✅ **Local Storage Persistence**
- ✅ **Multi-tab Synchronization**

## 🚀 Quick Start

### 1. **Import and Use ThemeProvider**

```tsx
import { ThemeProvider } from "./context/theme-context";

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. **Add Theme Toggle**

```tsx
import { ThemeToggle } from "./components/ui/ThemeToggle";

function Header() {
  return (
    <header>
      {/* Simple toggle button */}
      <ThemeToggle />

      {/* Or dropdown with all options */}
      <ThemeToggle variant="dropdown" showLabel />
    </header>
  );
}
```

### 3. **Use Theme Hook**

```tsx
import { useTheme } from "./context/theme-context";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Resolved theme: {resolvedTheme}</p>
      <button onClick={() => setTheme("dark")}>Switch to Dark</button>
    </div>
  );
}
```

## 🎨 Styling Components

### **Using Tailwind Classes**

```tsx
// Responsive to theme automatically
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

### **Using Bootstrap Variables**

```tsx
// Direct Bootstrap color usage
<div className="bg-bs-primary text-white">
  <button className="bg-bs-success hover:opacity-90">Success Button</button>
</div>
```

### **Mixed Approach**

```tsx
// Best of both worlds
<Card className="bg-card border">
  <CardHeader className="bg-bs-primary text-white">
    <h3>Course Title</h3>
  </CardHeader>
  <CardContent className="text-foreground">
    <Badge className="bg-bs-success-subtle text-bs-success">Beginner</Badge>
  </CardContent>
</Card>
```

## 🎛️ Theme Configuration

### **Available Themes**

```tsx
type Theme = "light" | "dark" | "system";
```

### **Theme Provider Props**

```tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme; // Default: 'system'
}
```

### **useTheme Hook Returns**

```tsx
interface ThemeContextType {
  theme: Theme; // User's selected theme
  setTheme: (theme: Theme) => void; // Function to change theme
  resolvedTheme: "light" | "dark"; // Actual theme being used
}
```

## 🔧 Component Variants

### **ThemeToggle Component**

```tsx
interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'dropdown';
}

// Simple toggle (light ↔ dark)
<ThemeToggle />

// With label
<ThemeToggle showLabel />

// Dropdown with all options
<ThemeToggle variant="dropdown" />

// Full featured
<ThemeToggle
  variant="dropdown"
  showLabel
  className="custom-styles"
/>
```

## 📱 Mobile Support

### **Theme Color Meta Tag**

The implementation automatically updates the mobile browser theme color:

```html
<meta name="theme-color" content="#ffffff" />
<!-- Light -->
<meta name="theme-color" content="#212529" />
<!-- Dark -->
```

### **Responsive Design**

```tsx
// Mobile-first approach
<div
  className="
  p-4 md:p-6 
  bg-background 
  text-foreground
  dark:shadow-lg
"
>
  Content adapts to screen size and theme
</div>
```

## 🎯 Color System

### **Semantic Colors (Recommended)**

```css
/* Always use semantic colors for best theme support */
--background         /* Main background */
--foreground         /* Main text color */
--primary           /* Brand primary color */
--primary-foreground /* Text on primary background */
--secondary         /* Secondary background */
--muted             /* Muted background */
--muted-foreground  /* Muted text */
--card              /* Card background */
--border            /* Border color */
```

### **Bootstrap Integration**

```css
/* Bootstrap semantic colors work in both themes */
--bs-primary        /* #066ac9 */
--bs-success       /* #0cbc87 */
--bs-danger        /* #d6293e */
--bs-warning       /* #f7c32e */
```

## 🔄 Auto-sync Features

### **Local Storage Persistence**

- Theme preference is saved automatically
- Restored on page reload
- Works across browser sessions

### **Multi-tab Synchronization**

- Theme changes sync across all tabs
- Uses storage events for real-time updates

### **System Theme Detection**

- Automatically follows OS dark/light mode
- Updates when system preference changes
- Respects user's manual override

## 🎪 Demo Component

To test the theme system:

```tsx
import { ThemeDemo } from "./components/demo/ThemeDemo";

// Shows all colors, components, and theme states
<ThemeDemo />;
```

## 🔥 Performance Features

### **No FOUC Prevention**

- Theme initialization script in `<head>`
- CSS-only initial render
- Instant theme application

### **Smooth Transitions**

```css
/* All elements transition smoothly between themes */
* {
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out,
    color 0.2s ease-in-out;
}
```

### **Optimized Bundle**

- Tree-shaking compatible
- No runtime CSS generation
- Minimal JavaScript footprint

## 🛠️ Advanced Usage

### **Custom Theme Detection**

```tsx
function MyComponent() {
  const { resolvedTheme } = useTheme();

  return (
    <div>
      {resolvedTheme === "dark" ? (
        <DarkModeSpecificComponent />
      ) : (
        <LightModeSpecificComponent />
      )}
    </div>
  );
}
```

### **Theme-aware Animations**

```tsx
<div
  className={`
  transform transition-all duration-300
  ${resolvedTheme === "dark" ? "scale-105 shadow-2xl" : "scale-100 shadow-lg"}
`}
>
  Content with theme-specific animations
</div>
```

### **Conditional Styling**

```tsx
function AdaptiveIcon() {
  const { resolvedTheme } = useTheme();

  return (
    <img
      src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Logo"
    />
  );
}
```

## 🎨 Education Theme Showcase

### **Course Card Example**

```tsx
<div className="bg-card border rounded-lg overflow-hidden">
  <div className="bg-bs-primary text-white p-4">
    <h3 className="font-bold">React Fundamentals</h3>
    <p className="text-blue-100">Learn modern React development</p>
  </div>

  <div className="p-4">
    <div className="flex gap-2 mb-3">
      <Badge className="bg-bs-success-subtle text-bs-success">Beginner</Badge>
      <Badge className="bg-bs-warning-subtle text-bs-warning">Popular</Badge>
    </div>

    <p className="text-muted-foreground">
      Master React hooks, components, and state management
    </p>

    <button
      className="
      mt-4 w-full py-2 px-4 
      bg-primary text-primary-foreground 
      rounded hover:opacity-90 transition-opacity
    "
    >
      Enroll Now
    </button>
  </div>
</div>
```

## 🚨 Troubleshooting

### **Theme Not Applying**

1. Check if ThemeProvider wraps your app
2. Ensure theme-init.js is loaded in HTML head
3. Verify CSS imports order

### **FOUC Issues**

1. Make sure theme-init.js loads before React
2. Check meta theme-color tag exists
3. Verify CSS variables are defined

### **Colors Not Changing**

1. Use semantic colors instead of fixed values
2. Check CSS specificity conflicts
3. Ensure dark mode classes are properly applied

### **Performance Issues**

1. Avoid inline styles for theme-dependent values
2. Use CSS variables instead of JavaScript calculations
3. Minimize theme-dependent re-renders

## 🎯 Best Practices

### **✅ Do:**

- Use semantic color variables
- Implement theme-aware components
- Test in both light and dark modes
- Provide theme toggle in UI
- Use system theme as default

### **❌ Avoid:**

- Hardcoded color values
- Ignoring system preferences
- Complex theme logic in components
- Inline styles for theme colors
- Forgetting mobile theme-color

## 🎊 Ready to Use!

Your E-learning platform now has a professional theme system that:

- 🎨 Looks great in any lighting condition
- 📱 Works perfectly on mobile devices
- ⚡ Loads instantly without flashes
- 🔄 Syncs across browser tabs
- 🎯 Follows modern UX patterns

Happy theming! 🚀
