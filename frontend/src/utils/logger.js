// frontend/src/utils/logger.js

const logger = {
    log: (message, ...args) => {
        console.log(`[${new Date().toISOString()}] QuizApp Log: ${message}`, ...args);
    },
    warn: (message, ...args) => {
        console.warn(`[${new Date().toISOString()}] QuizApp Warning: ${message}`, ...args);
    },
    error: (message, ...args) => {
        console.error(`[${new Date().toISOString()}] QuizApp Error: ${message}`, ...args);
    },
};

export default logger;
