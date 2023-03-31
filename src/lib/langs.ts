export const LANGUAGE_EXTENSION_MAP = {
  javascript: ["js", "mjs", "cjs"],
  python: ["py", "pyw"],
  java: ["java"],
  c: ["c"],
  "c++": ["cpp", "cc", "cxx", "c++"],
  "c#": ["cs"],
  "objective-c": ["m", "mm"],
  swift: ["swift"],
  ruby: ["rb", "rake", "ru", "erb"],
  go: ["go"],
  php: ["php", "phtml"],
  perl: ["pl", "pm"],
  scala: ["scala", "sc"],
  kotlin: ["kt", "kts"],
  r: ["R", "r"],
  typescript: ["ts", "tsx"],
  lua: ["lua"],
  rust: ["rs"],
  haskell: ["hs", "lhs"],
  erlang: ["erl"],
  elixir: ["ex", "exs"],
  clojure: ["clj", "cljs", "cljc", "edn"],
  dart: ["dart"],
  groovy: ["groovy", "gvy", "gy", "gsh"],
  shell: ["sh", "bash", "zsh", "csh", "tcsh", "ksh"],
  matlab: ["m"],
} as Readonly<Record<string, string[]>>;

export const EXTENSION_TO_LANG_MAP = Object.entries(LANGUAGE_EXTENSION_MAP).reduce((acc, [lang, extensions]) => {
  extensions.forEach((ext) => {
    acc[ext] = lang;
  });
  return acc;
}, {} as Record<string, string>);
export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_EXTENSION_MAP);
