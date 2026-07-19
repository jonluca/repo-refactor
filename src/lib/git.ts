import { execa } from "execa";
import type { SimpleGit, SimpleGitOptions } from "simple-git";
import { simpleGit } from "simple-git";
import jetpack from "fs-jetpack";
import walk from "ignore-walk";
import { resolve } from "node:path";

export const isGitRepo = async (path: string) => {
  try {
    new URL(path);
    return true;
  } catch {
    // skip, not a URL
  }

  if (path.startsWith("git@")) {
    return true;
  }

  try {
    await execa("git", ["ls-remote", "-q", "-h", path]);
    return true;
  } catch (e) {
    return false;
  }
};

export const listFiles = async (path: string) => {
  const files = await walk({
    path, // root dir to start in. defaults to process.cwd()
    ignoreFiles: [".gitignore", ".ignore", ".npmignore"], // list of filenames. defaults to ['.ignore']
    includeEmpty: true, // true to include empty dirs, default false
    follow: true, // true to follow symlink dirs, default false
  });

  // ignore-walk doesn't ignore .git for some reason
  return files.filter((file) => file !== ".git" && !file.startsWith(".git/"));
};

export const normalizeCloneSource = (repo: string) => {
  try {
    new URL(repo);
    return repo;
  } catch {
    return repo.startsWith("git@") ? repo : resolve(repo);
  }
};

export const cloneRepo = async (repo: string): Promise<string> => {
  const tmp = jetpack.tmpDir();

  const baseDir = tmp.path();
  const options: Partial<SimpleGitOptions> = {
    baseDir,
    binary: "git",
    maxConcurrentProcesses: 6,
    trimmed: false,
  };

  // when setting all options in a single object
  const git: SimpleGit = simpleGit(options);

  await git.clone(normalizeCloneSource(repo), baseDir, { "--depth": "1" });

  return baseDir;
};
