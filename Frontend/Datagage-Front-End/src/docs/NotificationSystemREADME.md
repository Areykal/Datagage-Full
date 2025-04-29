# Datagage Notification System

This document provides an overview of the Datagage notification system architecture.

## Architecture Overview

The notification system consists of the following key components:

1. **Pinia Store**: The central state management for notifications (`src/stores/notificationStore.js`)
2. **Utility Functions**: A helper library that makes it easy to display notifications from anywhere (`src/utils/notifications.js`)
3. **Shared Constants**: Common values used across the notification system (`src/utils/notificationConstants.js`)
4. **UI Components**: 
   - `ToastNotification.vue`: Individual notification component
   - `NotificationContainer.vue`: Container managing multiple notifications
   - `NotificationDisplay.vue`: Simple snackbar notifications using Vuetify

## How to Use Notifications

### Option 1: Using the notify utility (Recommended)

```js
import { notify } from "@/utils/notifications";

// Basic usage
notify.success("Operation successful");
notify.error("Something went wrong");
notify.warning("Please be careful");
notify.info("For your information");

// With options
notify.success("Item created successfully", {
  title: "Success",          // Add a title
  timeout: 3000,             // Override default timeout (in ms)
  position: "top-right"      // Position on screen
});
```

### Option 2: Using the store directly

```js
import { useNotificationStore } from "@/stores/notificationStore";

const notificationStore = useNotificationStore();

// Basic usage
notificationStore.success("Operation successful");
notificationStore.error("Something went wrong");

// Full control
notificationStore.show(
  "Custom notification",     // message
  "info",                    // type: success, error, warning, info
  5000,                      // timeout in ms (0 for no auto-dismiss)
  "bottom-center",           // position
  "Custom Title"             // title
);
```

### Option 3: From templates using the global $notify

Available anywhere in templates after installing the plugin:

```html
<v-btn @click="$notify.success('Button clicked!')">
  Click Me
</v-btn>
```

## Notification Types

The system supports four notification types, each with its own styling and icon:

- `success`: For successful operations (green)
- `error`: For errors and failures (red)
- `warning`: For warning messages (orange/yellow)
- `info`: For informational messages (blue)

## Position Options

Notifications can be displayed in six different positions:

- `top-right` (default)
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

## Advanced Features

### Dismissing Notifications

```js
// By ID (returned when creating a notification)
const notificationId = notify.success("Operation completed");
notify.dismiss(notificationId);

// Clear all notifications
notify.clearAll();
```

### Managing Unread Status

```js
// Mark a specific notification as read
notificationStore.markAsRead(notificationId);

// Mark all notifications as read
notificationStore.markAllAsRead();

// Get unread count
const unreadCount = notificationStore.unread;
```

### Accessing Notifications List

```js
// Get all notifications
const allNotifications = notificationStore.notifications;

// Get count
const count = notificationStore.count;
```

## Constants

Common values used by the notification system are available in `notificationConstants.js`:

```js
import { NOTIFICATION_TYPES, NOTIFICATION_POSITIONS } from "@/utils/notificationConstants";

// Use constants for type
notify.show("Message", NOTIFICATION_TYPES.SUCCESS);

// Use constants for position
notify.info("Message", { position: NOTIFICATION_POSITIONS.BOTTOM_CENTER });
```