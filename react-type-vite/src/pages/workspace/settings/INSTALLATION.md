# Channel Settings Installation Guide

## 📦 Required Dependencies

Run this command to install all required dependencies:

```powershell
npm install @radix-ui/react-switch @radix-ui/react-avatar @radix-ui/react-toast @radix-ui/react-alert-dialog class-variance-authority
```

Or if you prefer yarn:

```powershell
yarn add @radix-ui/react-switch @radix-ui/react-avatar @radix-ui/react-toast @radix-ui/react-alert-dialog class-variance-authority
```

## 🔧 Post-Installation Steps

### 1. Add Toaster to Your App

In your main `App.tsx` or root layout component, add:

```tsx
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      {/* Your existing app content */}
      <Toaster />
    </>
  );
}
```

### 2. Verify Path Aliases

Make sure your `tsconfig.json` includes the path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 3. Test the Component

You can test using the demo component:

```tsx
import { ChannelSettingsDemo } from "@/pages/workspace/ChannelSettingsDemo";

// Add to a route or render directly
<ChannelSettingsDemo />;
```

## ✅ Files Created

### Core Components

- ✅ `src/pages/workspace/settings/ChannelSettings.tsx` - Main modal
- ✅ `src/pages/workspace/settings/OverviewSection.tsx` - Overview tab
- ✅ `src/pages/workspace/settings/MembersSection.tsx` - Members tab
- ✅ `src/pages/workspace/settings/PermissionsSection.tsx` - Permissions tab
- ✅ `src/pages/workspace/settings/IntegrationsSection.tsx` - Integrations tab
- ✅ `src/pages/workspace/settings/DeleteChannelSection.tsx` - Delete tab
- ✅ `src/pages/workspace/settings/index.ts` - Barrel export

### Types

- ✅ `src/types/channel.types.ts` - Channel interfaces and enums

### UI Components

- ✅ `src/components/ui/switch.tsx` - Toggle switch
- ✅ `src/components/ui/avatar.tsx` - User avatar
- ✅ `src/components/ui/toast.tsx` - Toast notification
- ✅ `src/components/ui/toaster.tsx` - Toast container

### Hooks

- ✅ `src/hooks/use-toast.ts` - Toast management hook

### Documentation & Demo

- ✅ `src/pages/workspace/settings/README.md` - Full documentation
- ✅ `src/pages/workspace/ChannelSettingsDemo.tsx` - Usage example

## 🚀 Quick Start

After installing dependencies:

```tsx
import { useState } from "react";
import { ChannelSettings } from "@/pages/workspace/settings";
import { Channel, ChannelType, ChannelStatus } from "@/types/channel.types";

function MyWorkspace() {
  const [showSettings, setShowSettings] = useState(false);

  const channel: Channel = {
    id: "ch_123",
    participantHash: "u1_u2",
    channelName: "general",
    description: "General discussion",
    workspaceId: "ws_123",
    classId: null,
    memberIds: ["u1", "u2"],
    isPrivate: false,
    type: ChannelType.TEXT,
    status: ChannelStatus.ACTIVE,
    durationMinutes: 60,
  };

  return (
    <>
      <button onClick={() => setShowSettings(true)}>Settings</button>

      {showSettings && (
        <ChannelSettings
          channel={channel}
          onClose={() => setShowSettings(false)}
          onSave={async (data) => {
            console.log("Saving:", data);
            // TODO: Call your API
          }}
          onDelete={async (id) => {
            console.log("Deleting:", id);
            // TODO: Call your API
          }}
        />
      )}
    </>
  );
}
```

## 🎯 Next Steps

1. **Install Dependencies** - Run the npm/yarn command above
2. **Add Toaster** - Add `<Toaster />` to your App component
3. **Test Demo** - Import and render `ChannelSettingsDemo`
4. **Integrate** - Use the component in your workspace pages
5. **Connect API** - Implement the onSave and onDelete handlers

## 📚 Full Documentation

See `src/pages/workspace/settings/README.md` for complete documentation including:

- Detailed feature list
- API integration examples
- Customization guide
- Troubleshooting tips
- Type definitions

## 🎨 Component Preview

The component includes:

- 🎨 Discord-like dark theme
- 📱 Fully responsive layout
- ⌨️ Keyboard shortcuts (ESC to close)
- 💾 Auto-save detection
- 🔔 Toast notifications
- ✅ Form validation
- 👥 Member management
- 🗑️ Safe deletion with confirmation

## ❓ Troubleshooting

### Error: Cannot find module '@radix-ui/...'

**Solution:** Run the installation command above

### Error: Cannot find module '@/...'

**Solution:** Check your `tsconfig.json` path aliases

### Toast not showing

**Solution:** Add `<Toaster />` to your root component

For more help, see the full README in the settings folder.
