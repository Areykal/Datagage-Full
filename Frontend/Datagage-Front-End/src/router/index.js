import { createRouter, createWebHistory } from "vue-router";
import { auth } from "@/utils/auth";

// Import layouts
import AppLayout from "@/layouts/AppLayout.vue";

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
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: "",
        name: "Dashboard",
        component: DashboardPage,
        meta: { title: "Dashboard" },
      },
      {
        path: "analytics",
        name: "Analytics",
        component: Analytics,
        meta: { title: "Analytics" },
      },
      {
        path: "sources",
        name: "DataSources",
        component: DataSources,
        meta: { title: "Data Sources" },
      },
      {
        path: "sources/new",
        name: "source-new",
        component: SourceNewPage,
        meta: { title: "Add Data Source" },
      },
      {
        path: "sources/:id",
        name: "source-details",
        component: SourceDetailsPage,
        props: true,
        meta: { title: "Source Details" },
      },
      {
        path: "settings",
        name: "Settings",
        component: SettingsPage,
        meta: { title: "Settings" },
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { title: "Login" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
    meta: { title: "Page Not Found" },
  },
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach((to, from, next) => {
  // Update document title
  document.title = to.meta.title ? `${to.meta.title} | Datagage` : "Datagage";

  // Check authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // This route requires auth, check if logged in
    if (!auth.isAuthenticated()) {
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
