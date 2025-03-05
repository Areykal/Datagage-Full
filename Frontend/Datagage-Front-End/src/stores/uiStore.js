import { defineStore } from "pinia";
import { ref, watch } from "vue";

export const useUiStore = defineStore("ui", () => {
  // Get the initial drawer state with proper fallback
  const getInitialDrawerState = () => {
    try {
      const saved = localStorage.getItem("nav_drawer_state");
      // Default to true if not explicitly set to false
      return saved !== "false";
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return true; // Default to open if there's an error
    }
  };

  // State
  const navDrawerOpen = ref(getInitialDrawerState());

  // Actions
  function toggleNavDrawer() {
    navDrawerOpen.value = !navDrawerOpen.value;
    saveDrawerState();
  }

  function setNavDrawerOpen(isOpen) {
    navDrawerOpen.value = isOpen;
    saveDrawerState();
  }

  // Save to localStorage with error handling
  function saveDrawerState() {
    try {
      localStorage.setItem("nav_drawer_state", String(navDrawerOpen.value));
    } catch (e) {
      console.error("Error writing to localStorage:", e);
    }
  }

  // Watch for changes to ensure UI is updated
  watch(
    navDrawerOpen,
    () => {
      document.documentElement.style.setProperty(
        "--nav-drawer-width",
        navDrawerOpen.value ? "256px" : "56px"
      );
    },
    { immediate: true }
  );

  return {
    navDrawerOpen,
    toggleNavDrawer,
    setNavDrawerOpen,
  };
});
