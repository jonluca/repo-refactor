import fs from "fs-extra";
import glob from "glob";
import { Configuration, OpenAIApi } from "openai";
import { args } from "./index";

export class Refactor {
  openai: OpenAIApi;
  opts: typeof args = args;
  constructor() {
    const configuration = new Configuration({
      apiKey: this.opts.openaiApiKey,
    });
    this.openai = new OpenAIApi(configuration);
  }

  refactor = async (): Promise<void> => {
    const { dest: destDir, src: srcDir } = this.opts;
    // Create destination directory if it does not exist
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir);
    }

    // Get all files in source directory with specified language extension
    const files = glob.sync(`${srcDir}/**/*`);

    // Refactor each file
    for (const file of files) {
      const sourceCode = await fs.readFile(file, "utf-8");
      // Convert AST into target language code
      const convertedCode = await this.transformCode(sourceCode);

      if (convertedCode) {
        // Write refactored code to destination file
        const outputFile = file.replace(`${srcDir}/`, "").replace(from, to);
        const outputPath = `${destDir}/${outputFile}`;
        const outputDir = outputPath.substring(0, outputPath.lastIndexOf("/"));
        if (!(await fs.exists(outputDir))) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        await fs.writeFile(outputPath, convertedCode, "utf-8");
      }
    }
  };

  transformCode = async (sourceCode: string): Promise<string | undefined> => {
    const completion = await this.openai.createCompletion({
      model: "gpt-4",
      prompt: sourceCode,
    });
    const text = completion.data.choices[0].text;
    return text;
  };
}
