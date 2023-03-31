import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;
const ts = timestamp({
  format: "YYYY-MM-DD HH:mm:ss",
});
const color = colorize();
const print = printf(
  (info) =>
    `[${info.timestamp}] [${info.level}] - ${info.message}` + (info.splat !== undefined ? `${info.splat}` : " "),
);
const format = combine(ts, color, print);
const nonColorFormat = combine(ts, print);

const logger = winston.createLogger({
  level: "debug",
  format: nonColorFormat,
  transports: [
    new winston.transports.Console({
      format,
    }),
  ],
});

export default logger;
