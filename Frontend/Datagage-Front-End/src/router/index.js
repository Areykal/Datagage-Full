import { createRouter, createWebHistory } from "vue-router";
import { auth } from "@/utils/auth";
import { notify } from "@/utils/notifications";

// Import all pages
import DashboardPage from "@/pages/DashboardPage.vue";
import Analytics from "@/pages/Analytics.vue";
import DataSources from "@/pages/DataSources.vue";
import LoginPage from "@/pages/LoginPage.vue";
import SourceNewPage from "@/pages/SourceNewPage.vue";
import SourceDetailsPage from "@/pages/SourceDetailsPage.vue";
import SettingsPage from "@/pages/SettingsPage.vue";
import NotFound from "@/pages/NotFound.vue";

// Define routes
const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true, title: "Dashboard" },
  },
  {
    path: "/analytics",
    name: "Analytics",
    component: Analytics,
    meta: { requiresAuth: true, title: "Analytics" },
  },
  {
    path: "/sources",
    name: "DataSources",
    component: DataSources,
    meta: { requiresAuth: true, title: "Data Sources" },
  },
  {
    path: "/sources/new",
    name: "source-new",
    component: SourceNewPage,
    meta: { requiresAuth: true, title: "Add Data Source" },
  },
  {
    path: "/sources/:id",
    name: "source-details",
    component: SourceDetailsPage,
    props: true,
    meta: { requiresAuth: true, title: "Source Details" },
  },
  {
    path: "/settings",
    name: "Settings",
    component: SettingsPage,
    meta: { requiresAuth: true, title: "Settings" },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { guest: true, title: "Login" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
    meta: { title: "Page Not Found" },
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title ? `${to.meta.title} | Datagage` : "Datagage";

  // Handle authentication
  const isAuthenticated = auth.isAuthenticated();

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      notify.warning("Please log in to access this page");
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    } else {
      next();
    }
  } else if (
    to.matched.some((record) => record.meta.guest) &&
    isAuthenticated
  ) {
    // If already logged in, redirect to dashboard
    next("/");
  } else {
    next();
  }
});

export default router;
