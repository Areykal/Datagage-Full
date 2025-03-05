/**
 * Global error handler for Vue applications
 * This will help identify issues with component rendering
 */

export function setupErrorHandlers() {
  console.log("[ErrorHandler] Setting up global error handlers");

  // Handle uncaught promise rejections
  window.addEventListener("unhandledrejection", function (event) {
    console.error("[Unhandled Promise Rejection]:", event.reason);

    // You could also send this to an error tracking service
    if (event.reason && event.reason.message) {
      console.error("Error message:", event.reason.message);
      console.error("Stack trace:", event.reason.stack);
    }
  });

  // Create a custom handler for Vue errors
  const originalConsoleError = console.error;
  console.error = function (...args) {
    // Check if this is a Vue warning
    const message = args.join(" ");
    if (message.includes("[Vue warn]")) {
      console.log("[Vue Error Detected]:", message);

      // Extract component info if available
      const componentMatch = message.match(/in component <([^>]+)>/);
      if (componentMatch) {
        console.log("Component with error:", componentMatch[1]);
      }
    }

    // Call original console.error
    originalConsoleError.apply(console, args);
  };
}

export function logComponentRender(componentName) {
  console.log(`[Component] ${componentName} is rendering`);
}
