# Channel Settings Component

A Discord-like channel settings interface built with React, TypeScript, Tailwind CSS, and Shadcn UI.

## 📁 File Structure

```
src/pages/workspace/settings/
├── ChannelSettings.tsx          # Main settings modal component
├── OverviewSection.tsx          # Overview/general settings tab
├── MembersSection.tsx           # Member management tab
├── PermissionsSection.tsx       # Permissions placeholder tab
├── IntegrationsSection.tsx      # Integrations placeholder tab
├── DeleteChannelSection.tsx     # Channel deletion tab
└── index.ts                     # Exports

src/types/
└── channel.types.ts             # Channel types and enums

src/components/ui/
├── switch.tsx                   # Switch component (created)
├── avatar.tsx                   # Avatar component (created)
├── toast.tsx                    # Toast component (created)
└── toaster.tsx                  # Toaster container (created)

src/hooks/
└── use-toast.ts                 # Toast hook (created)
```

## 🚀 Features

### ✅ Overview Section

- **Channel Name** - Edit the channel name
- **Description** - Rich text area for channel topic (max 1024 chars)
- **Workspace ID** - Read-only field showing workspace
- **Class ID** - Optional numeric field to link to a class
- **Channel Type** - Dropdown (TEXT, VOICE, LIVE_STREAM, ASSIGNMENT)
- **Private Channel** - Toggle switch for privacy
- **Duration** - Minutes before channel locks
- **Status** - Dropdown (ACTIVE, LOCKED, ARCHIVED)
- **Participant Hash** - Read-only auto-generated hash

### ✅ Members Section

- **Member List** - Table with avatar, name, email
- **Search Members** - Filter existing members
- **Add Member** - Dialog to search and add users
- **Remove Member** - Button to remove each member
- **Member Count** - Display total members

### ✅ Permissions Section

- Placeholder for future permissions features

### ✅ Integrations Section

- Placeholder for future integrations

### ✅ Delete Channel Section

- **Confirmation Input** - Type channel name to confirm
- **Warning Messages** - Clear danger zone indicators
- **Deletion List** - Shows what gets deleted
- **Confirmation Dialog** - Final alert before deletion

## 📦 Installation

### 1. Install Required Dependencies

```powershell
# Install Radix UI primitives
npm install @radix-ui/react-switch @radix-ui/react-avatar @radix-ui/react-toast

# Install class-variance-authority (if not already installed)
npm install class-variance-authority
```

### 2. Files Created

All necessary files have been created in your workspace:

- Channel types and enums
- All 6 section components
- Main ChannelSettings component
- UI components (Switch, Avatar, Toast, Toaster)
- Toast hook
- Demo/example component

## 🎯 Usage

### Basic Implementation

```tsx
import { useState } from "react";
import { ChannelSettings } from "@/pages/workspace/settings";
import { Channel, ChannelType, ChannelStatus } from "@/types/channel.types";

function YourWorkspacePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Your channel data
  const channel: Channel = {
    id: "ch_123",
    participantHash: "u1_u2_u3",
    channelName: "general",
    description: "General discussion channel",
    workspaceId: "ws_123",
    classId: null,
    memberIds: ["u1", "u2", "u3"],
    isPrivate: false,
    type: ChannelType.TEXT,
    status: ChannelStatus.ACTIVE,
    durationMinutes: 60,
  };

  const handleSave = async (channelData: Channel) => {
    // Call your API to save changes
    await api.updateChannel(channelData.id, channelData);
  };

  const handleDelete = async (channelId: string) => {
    // Call your API to delete channel
    await api.deleteChannel(channelId);
    // Navigate away after deletion
    navigate("/workspace");
  };

  return (
    <>
      <button onClick={() => setIsSettingsOpen(true)}>Open Settings</button>

      {isSettingsOpen && (
        <ChannelSettings
          channel={channel}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
```

### Integration with Toast

Add the `Toaster` component to your app root:

```tsx
// In App.tsx or your root component
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <>
      {/* Your app content */}
      <Toaster />
    </>
  );
}
```

## 🎨 Customization

### Color Scheme (Discord-like Dark Theme)

The component uses these color classes:

- `bg-[#2b2d31]` - Main background
- `bg-[#1e1f22]` - Sidebar and inputs
- `bg-[#404249]` - Hover states
- `text-[#b5bac1]` - Secondary text
- `text-[#949ba4]` - Muted text
- `bg-[#5865f2]` - Primary accent (Discord blue)
- `text-[#f23f42]` - Danger red

### Modifying Styles

You can customize by:

1. Changing Tailwind classes directly in components
2. Updating the component props
3. Extending with additional className props

## 🔌 API Integration

### Update Channel

```tsx
const handleSave = async (channelData: Channel) => {
  try {
    const response = await fetch(`/api/channels/${channelData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(channelData),
    });

    if (!response.ok) throw new Error("Failed to update");

    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### Delete Channel

```tsx
const handleDelete = async (channelId: string) => {
  try {
    const response = await fetch(`/api/channels/${channelId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete");

    // Navigate away or update UI
  } catch (error) {
    // Handle error
  }
};
```

## 📝 Type Definitions

### Channel Interface

```typescript
interface Channel {
  id: string;
  participantHash: string;
  channelName: string;
  description: string;
  workspaceId: string;
  classId: number | null;
  memberIds: string[];
  isPrivate: boolean;
  type: ChannelType;
  status: ChannelStatus;
  durationMinutes: number;
}
```

### Enums

```typescript
enum ChannelType {
  TEXT = "TEXT",
  VOICE = "VOICE",
  LIVE_STREAM = "LIVE_STREAM",
  ASSIGNMENT = "ASSIGNMENT",
}

enum ChannelStatus {
  ACTIVE = "ACTIVE",
  LOCKED = "LOCKED",
  ARCHIVED = "ARCHIVED",
}
```

## 🎮 Demo Component

A demo component is available at:

```
src/pages/workspace/ChannelSettingsDemo.tsx
```

You can view it by importing and rendering:

```tsx
import { ChannelSettingsDemo } from "@/pages/workspace/ChannelSettingsDemo";
```

## ⚡ Features Breakdown

### Keyboard Shortcuts

- **ESC** - Close settings modal

### Form Validation

- Channel name required
- Duration must be positive number
- Confirmation text must match for deletion

### State Management

- Tracks unsaved changes
- Disables save button when no changes
- Shows warning for unsaved changes

### Member Management

- Search existing members
- Add new members via dialog
- Remove members with confirmation
- Display member count

### Error Handling

- Toast notifications for success/error
- Try-catch blocks for async operations
- User-friendly error messages

## 🔮 Future Enhancements

### Permissions Section

- Role-based access control
- Custom permission sets
- Member-specific permissions

### Integrations Section

- Webhook management
- Bot integrations
- Third-party services
- Notification systems

## 🐛 Troubleshooting

### Missing Dependencies

If you see import errors, ensure all dependencies are installed:

```powershell
npm install @radix-ui/react-switch @radix-ui/react-avatar @radix-ui/react-toast class-variance-authority
```

### Toast Not Showing

Make sure `<Toaster />` is added to your root component (App.tsx or main layout).

### Type Errors

Ensure your TypeScript configuration includes:

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

## 📄 License

This component is part of your E-Learning platform project.

## 🤝 Contributing

To extend this component:

1. Add new sections by creating components in the `settings/` folder
2. Import and add to the `menuItems` array in `ChannelSettings.tsx`
3. Add conditional rendering in the content area
4. Update types in `channel.types.ts` as needed

## 📞 Support

For issues or questions, please refer to your project documentation or team lead.
