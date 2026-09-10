const pino = require("pino");

const usePrettyTransport = !["production", "test"].includes(process.env.NODE_ENV);

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: usePrettyTransport
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

module.exports = logger;
