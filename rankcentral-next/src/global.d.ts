/**
 * @fileoverview Global type declarations for the Next.js application.
 * Contains ambient module declarations and global type definitions.
 */

// global.d.ts

/**
 * Global variable declarations for Node.js global object.
 */
declare global {
  /** @type {string} Custom environment variable for API access */
  var OPENAI_API_KEY: string | undefined;
}

export {};
