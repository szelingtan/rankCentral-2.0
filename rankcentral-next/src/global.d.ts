/**
 * @fileoverview Global type declarations for the application.
 * Extends the global namespace with custom type definitions.
 */

// global.d.ts

/**
 * Global variable declarations for Node.js global object.
 */
declare global {
  /** @type {{con: any, promise: any}} Global mongoose connection cache */
  var mongoose: { con: any, promise: any };
}

export {};
