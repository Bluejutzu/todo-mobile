type LogArgs = unknown[];

function shouldLogVerbose() {
  return typeof __DEV__ === 'undefined' ? process.env.NODE_ENV !== 'production' : __DEV__;
}

export const logger = {
  debug: (...args: LogArgs) => {
    if (shouldLogVerbose()) console.log(...args);
  },
  info: (...args: LogArgs) => {
    if (shouldLogVerbose()) console.info(...args);
  },
  warn: (...args: LogArgs) => {
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};
