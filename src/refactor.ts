import { args } from "./index";
import { OpenAIClient } from "./lib/openai";
import { cloneRepo, isGitRepo, listFiles } from "./lib/git";
import { LANGUAGE_EXTENSION_MAP } from "./lib/langs";
import jetpack from "fs-jetpack";
import logger from "./log";
import pLimit from "p-limit";
export class Refactor {
  openaiClient: OpenAIClient = new OpenAIClient();
  opts: typeof args = args;

  refactor = async (): Promise<void> => {
    const { dest: destDir, src: src } = this.opts;
    // Create destination directory if it does not exist
    await jetpack.dirAsync(destDir);
    let srcDir = src;

    if (await isGitRepo(src)) {
      logger.info("Detected git repository, cloning to temp directory...");
      srcDir = await cloneRepo(src);
      logger.info(`Cloned to temp directory: ${srcDir}`);
    }

    // Get all files in source directory with specified language extension
    const files = await listFiles(srcDir);
    logger.info(`Found ${files.length} files in source directory`);

    const validExtensions = LANGUAGE_EXTENSION_MAP[this.opts.from as keyof typeof LANGUAGE_EXTENSION_MAP];
    const newExtension = LANGUAGE_EXTENSION_MAP[this.opts.to as keyof typeof LANGUAGE_EXTENSION_MAP][0];
    // Refactor each file
    const fullSrcDir = jetpack.dir(srcDir);
    const fullDestDir = jetpack.dir(destDir);
    const limit = pLimit(10);
    const promises = files.map((file) =>
      limit(async () => {
        logger.info(`Refactoring file: ${file}`);
        const fullSourcePath = fullSrcDir.path(file);
        let fullDestinationPath = fullDestDir.path(file);
        const isSourceCodeFileOfTargetLang = validExtensions.find((ext) => file.endsWith(ext));
        if (isSourceCodeFileOfTargetLang) {
          const sourceCode = await jetpack.readAsync(fullSourcePath);
          if (sourceCode) {
            // Convert AST into target language code
            const convertedCode = await this.openaiClient.transformCode(sourceCode, file);

            if (convertedCode) {
              // Write refactored code to destination file
              const regexp = new RegExp(`\\.${isSourceCodeFileOfTargetLang}$`);
              fullDestinationPath = fullDestDir.path(file.replace(regexp, `.${newExtension}`));
              await jetpack.writeAsync(fullDestinationPath, convertedCode);
              logger.info(`Wrote refactored code to ${fullDestinationPath}`);
            }
          } else {
            logger.error(`Could not read file: ${file}`);
          }
        } else {
          logger.info(`File ${file} is not a source code file of target language, copying directly`);
          // otherwise, just copy the file directly
          await jetpack.copyAsync(fullSourcePath, fullDestinationPath, { overwrite: true });
        }
      }),
    );
    await Promise.all(promises);

    logger.info("Refactoring complete!");
  };
}
