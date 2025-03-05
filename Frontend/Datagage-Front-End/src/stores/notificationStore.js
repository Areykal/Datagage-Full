import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useNotificationStore = defineStore("notification", () => {
  // State
  const notifications = ref([]);
  const nextId = ref(1);

  // Computed
  const count = computed(() => notifications.value.length);
  const unread = computed(
    () => notifications.value.filter((n) => !n.read).length
  );

  // Actions
  const add = (notification) => {
    const id = nextId.value++;
    notifications.value.unshift({
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    });
    return id;
  };

  const remove = (id) => {
    notifications.value = notifications.value.filter((n) => n.id !== id);
  };

  const markAsRead = (id) => {
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach((n) => (n.read = true));
  };

  const clear = () => {
    notifications.value = [];
  };

  return {
    // State
    notifications,

    // Computed
    count,
    unread,

    // Actions
    add,
    remove,
    markAsRead,
    markAllAsRead,
    clear,
  };
});
