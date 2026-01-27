/**
 * Console utility that allows disabling console logs in production
 */
const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

const noop = () => {};

export const logger = {
  log: isDevelopment ? console.log : noop,
  warn: isDevelopment ? console.warn : noop,
  error: console.error, // Always log errors
  info: isDevelopment ? console.info : noop,
  debug: isDevelopment ? console.debug : noop,
};
