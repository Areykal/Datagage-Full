import router from "@/router";
import { notify } from "@/utils/notifications";

const USER_KEY = "datagage_user";
const TOKEN_KEY = "datagage_token";

export const auth = {
  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Set auth token in localStorage
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get current user from localStorage
  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Set user in localStorage
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Demo login (for development purposes only)
  async demoLogin(email = "demo@datagage.com", rememberMe = false) {
    try {
      // Create demo user and token
      const demoUser = {
        id: "1",
        name: "Demo User",
        email: email || "demo@datagage.com",
        role: "admin",
      };

      const demoToken = "demo-token-" + Math.random().toString(36).substring(2);

      // Store user and token
      this.setUser(demoUser);
      this.setToken(demoToken);

      // Notify success and redirect
      notify.success("Welcome to Datagage!");

      // Get redirect path if available
      const redirect = router.currentRoute.value.query.redirect || "/";
      await router.push(redirect);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "An error occurred during login",
      };
    }
  },

  // Log out
  async logout() {
    // Clear stored data
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    // Notify and redirect
    notify.info("You have been logged out");
    await router.push("/login");
  },
};

export default auth;
