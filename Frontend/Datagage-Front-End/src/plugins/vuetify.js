// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { md3 } from "vuetify/blueprints";
import { mdi } from "vuetify/iconsets/mdi";

// Custom theme
const darkTheme = {
  dark: true,
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#EC4899",
    error: "#EF4444",
    info: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    background: "#121212",
    surface: "#1E1E1E",
  },
};

export default createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: "darkTheme",
    themes: {
      darkTheme,
    },
  },
  icons: {
    defaultSet: "mdi",
    sets: {
      mdi,
    },
  },
  components,
  directives,
});
