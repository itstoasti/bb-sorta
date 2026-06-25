// Polyfill DOMException globally for Hermes JavaScript engine compatibility
if (typeof global.DOMException === 'undefined') {
  (global as any).DOMException = class DOMException extends Error {
    constructor(message: string, name?: string) {
      super(message);
      this.name = name || 'Error';
    }
  };
}
export {};
