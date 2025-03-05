/**
 * plugins/webfontloader.js
 *
 * webfontloader documentation: https://github.com/typekit/webfontloader
 */

export async function loadFonts() {
  // If running on the browser
  if (typeof document !== "undefined") {
    // We're already loading Inter font in index.html, so we don't need to load it again
    // Just provide a mock function for compatibility
    return;

    // Uncomment this if you want to load fonts dynamically instead
    /*
    const webFontLoader = await import('webfontloader')
    
    webFontLoader.load({
      google: {
        families: ['Inter:100,300,400,500,700,900&display=swap'],
      },
    })
    */
  }
}
