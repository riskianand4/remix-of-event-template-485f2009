import { logger } from './logger';

const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  error: console.error.bind(console),
};

export const productionConsole = {
  log: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      originalConsole.log(message, data);
    }
  },
  
  error: (message: string, data?: any) => {
    logger.error(message, data);
  },
  
  warn: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      originalConsole.warn(message, data);
    }
  },
  
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      originalConsole.debug(message, data);
    }
  },
  
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      originalConsole.info(message, data);
    }
  }
};

export const replaceConsoleWithLogger = () => {
  if (!import.meta.env.DEV) {
    window.console.log = () => {};
    window.console.warn = () => {};
    window.console.debug = () => {};
    window.console.info = () => {};
  }
};
