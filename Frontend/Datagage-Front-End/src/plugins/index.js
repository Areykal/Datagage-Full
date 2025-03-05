/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */
import vuetify from "./vuetify";

export function registerPlugins(app) {
  // No need to call loadFonts since we're loading them in index.html
  app.use(vuetify);
}
