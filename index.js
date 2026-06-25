// ENTRY POINT — This file MUST be plain JavaScript.
// Using require() instead of import to prevent ES module hoisting.

// Patch Object.defineProperty globally to force Event phase constants (like NONE)
// to be writable and configurable. React Native 0.81 makes them read-only by default,
// which crashes on libraries like event-target-shim when it attempts to re-assign them.
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function (obj, prop, descriptor) {
  if (
    prop === 'NONE' || prop === 'none' ||
    prop === 'CAPTURING_PHASE' || prop === 'capturing_phase' ||
    prop === 'AT_TARGET' || prop === 'at_target' ||
    prop === 'BUBBLING_PHASE' || prop === 'bubbling_phase'
  ) {
    try {
      return originalDefineProperty(obj, prop, {
        ...descriptor,
        writable: true,
        configurable: true,
      });
    } catch (e) {
      // Fallback in case of strict mode issues or frozen objects
    }
  }
  return originalDefineProperty(obj, prop, descriptor);
};

// Polyfill DOMException for Hermes BEFORE any module loads.
if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'Error';
    }
  };
}

// Private class properties polyfill for Hermes
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Global error handler to force logs to terminal console
if (globalThis.ErrorUtils) {
  const defaultHandler = globalThis.ErrorUtils.getGlobalHandler();
  globalThis.ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('⚠️ UNCAUGHT RUNTIME ERROR:', error);
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

// NOW load the actual app — require() runs synchronously AFTER the polyfills above.
try {
  const { registerRootComponent } = require('expo');
  const { default: App } = require('./App');
  registerRootComponent(App);
} catch (bootstrapError) {
  console.error('❌ CRITICAL APP BOOTSTRAP ERROR:', bootstrapError);
  throw bootstrapError;
}
