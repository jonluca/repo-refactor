# LLM-based Code Refactoring Tool

This TypeScript program is designed to refactor a directory of code written in one programming language into another programming language using Language Models (LLMs).

## Introduction

Refactoring code from one programming language to another can be a daunting task, particularly when the languages are very different. Manual refactoring is often time-consuming and error-prone, as it requires a deep understanding of both the source and target languages, as well as the specific project requirements. This is where LLMs come in - they can be used to automate the refactoring process by analyzing the semantics and syntax of the source and target languages.

This tool uses the OpenAI API, which provides a wide range of pre-trained LLMs for various languages. It also utilizes the [glob](https://github.com/isaacs/node-glob) package to match files and directories.

## Installation

To install the required packages, run the following command:

```bash
yarn install
```

## Usage

You will need an OpenAI API key, which can be obtained by signing up for an account [here](https://platform.openai.com/account/api-keys). Once you have an API key, you can set it as an environment variable by running the following command:

```bash
export OPENAI_API_KEY="<key>"
```

You can also pass it to the cli using the `--openaiApiKey` flag:

```bash
yarn start -- --openaiApiKey <key>
```

To use the program, simply run the following command:

```bash
yarn start -- --src <source_directory> --dest <destination_directory> --from <source_language> --to <target_language>
```

Here's an example:

```bash
npm start -- --src ./src --dest ./dist --from python --to javascript
```

This command will refactor all files in the `src` directory that have a `.py` extension into JavaScript files with a `.js` extension, and place the refactored files in the `dist` directory.

## How It Works

The program works by recursively searching the source directory for files with the specified source language extension, and then passing the contents of each file through a pre-trained LLM for the source language.

The refactored code is then written to a file in the destination directory with the specified target language extension. Any non-code files in the source directory are simply copied to the destination directory.

## Limitations

While this tool can be very useful in automating the refactoring of code from one language to another, it does have its limitations. The accuracy of the refactored code will depend largely on the quality of the pre-trained LLMs used for each language, as well as the complexity of the code being refactored. Additionally, the tool does not handle any language-specific libraries or dependencies that may be present in the original code. Therefore, some manual editing of the refactored code may be required in some cases.

## Conclusion

The LLM-based code refactoring tool is a powerful tool that can help streamline the process of refactoring code from one language to another. It is easy to use, and can save a significant amount of time and effort compared to manual refactoring. While it does have its limitations, it can still be a valuable tool for developers working on multi-language projects.
