import { extname } from "node:path";
import { args } from "./args.js";
import { OpenAIClient } from "./lib/openai.js";
import { cloneRepo, isGitRepo, listFiles } from "./lib/git.js";
import { LANGUAGE_EXTENSION_MAP } from "./lib/langs.js";
import jetpack from "fs-jetpack";
import logger from "./log.js";
import pLimit from "p-limit";

export const getSourceExtension = (file: string, validExtensions: readonly string[]) => {
  const extension = extname(file).slice(1);
  return validExtensions.includes(extension) ? extension : undefined;
};

export const planDestinationFiles = (files: string[], validExtensions: readonly string[], newExtension: string) => {
  const sourceExtensions = new Map<string, string>();
  const defaultDestinations = new Map<string, string>();
  const destinationCounts = new Map<string, number>();

  for (const file of files) {
    const sourceExtension = getSourceExtension(file, validExtensions);
    if (!sourceExtension) {
      continue;
    }

    const destination = `${file.slice(0, -(sourceExtension.length + 1))}.${newExtension}`;
    sourceExtensions.set(file, sourceExtension);
    defaultDestinations.set(file, destination);
    destinationCounts.set(destination, (destinationCounts.get(destination) ?? 0) + 1);
  }

  const destinations = new Map<string, string>();
  for (const [file, defaultDestination] of defaultDestinations) {
    destinations.set(
      file,
      destinationCounts.get(defaultDestination) === 1 ? defaultDestination : `${file}.${newExtension}`,
    );
  }

  return { destinations, sourceExtensions };
};

export class Refactor {
  openaiClient: OpenAIClient = new OpenAIClient();
  opts: typeof args = args;

  refactor = async (): Promise<void> => {
    const { dest: destDir, src: src } = this.opts;
    // Create destination directory if it does not exist
    await jetpack.dirAsync(destDir);
    let srcDir = src;
    let clonedDir: string | undefined;

    try {
      if (await isGitRepo(src)) {
        logger.info("Detected git repository, cloning to temp directory...");
        clonedDir = await cloneRepo(src);
        srcDir = clonedDir;
        logger.info(`Cloned to temp directory: ${srcDir}`);
      }

      // Get all files in source directory with specified language extension
      const files = await listFiles(srcDir);
      logger.info(`Found ${files.length} files in source directory`);

      const validExtensions = LANGUAGE_EXTENSION_MAP[this.opts.from as keyof typeof LANGUAGE_EXTENSION_MAP];
      const newExtension = LANGUAGE_EXTENSION_MAP[this.opts.to as keyof typeof LANGUAGE_EXTENSION_MAP][0];
      const { destinations, sourceExtensions } = planDestinationFiles(files, validExtensions, newExtension);
      // Refactor each file
      const fullSrcDir = jetpack.dir(srcDir);
      const fullDestDir = jetpack.dir(destDir);
      const limit = pLimit(10);
      const promises = files.map((file) =>
        limit(async () => {
          logger.info(`Refactoring file: ${file}`);
          const fullSourcePath = fullSrcDir.path(file);
          const sourceExtension = sourceExtensions.get(file);
          if (sourceExtension) {
            const sourceCode = await jetpack.readAsync(fullSourcePath);
            if (sourceCode !== undefined) {
              const fullDestinationPath = fullDestDir.path(destinations.get(file)!);
              // Convert AST into target language code
              const convertedCode = await this.openaiClient.transformCode(sourceCode, file);

              if (convertedCode !== undefined && convertedCode !== null) {
                // Write refactored code to destination file
                await jetpack.writeAsync(fullDestinationPath, convertedCode);
                logger.info(`Wrote refactored code to ${fullDestinationPath}`);
              }
            } else {
              logger.error(`Could not read file: ${file}`);
            }
          } else {
            const fullDestinationPath = fullDestDir.path(file);
            logger.info(`File ${file} is not a source code file of target language, copying directly`);
            // otherwise, just copy the file directly
            await jetpack.copyAsync(fullSourcePath, fullDestinationPath, { overwrite: true });
          }
        }),
      );
      await Promise.all(promises);

      logger.info("Refactoring complete!");
    } finally {
      if (clonedDir) {
        await jetpack.removeAsync(clonedDir);
      }
    }
  };
}
