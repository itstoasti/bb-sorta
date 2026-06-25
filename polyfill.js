// Polyfill DOMException globally for Hermes JavaScript engine compatibility.
// This file MUST be plain JavaScript (not TypeScript) because it is loaded
// by Metro's getModulesRunBeforeMainModule before the Babel transform pipeline
// may be fully ready.
if (typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'Error';
    }
  };
}
