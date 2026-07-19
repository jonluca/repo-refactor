import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { SUPPORTED_LANGUAGES } from "./lib/langs.js";

export const args = yargs(hideBin(process.argv))
  .options({
    openaiApiKey: {
      describe: "OpenAI API key",
      type: "string",
      demandOption: true,
      default: process.env.OPENAI_API_KEY,
    },
    src: {
      describe: "Source directory or git repository",
      type: "string",
      demandOption: true,
    },
    dest: {
      describe: "Destination directory",
      type: "string",
      demandOption: true,
    },
    from: {
      describe: "Source language",
      type: "string",
      demandOption: true,
      choices: SUPPORTED_LANGUAGES,
    },
    to: {
      describe: "Target language",
      type: "string",
      demandOption: true,
      choices: SUPPORTED_LANGUAGES,
    },
  })
  .parseSync();
