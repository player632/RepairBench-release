// RepairBench adaptation: these two shorthand ambient modules used to name the remote cdnjs
// specifiers that src/prism.ts awaited. The core specifier is now "prismjs", which @types/prismjs
// already types, so only the language-component subpath still needs a declaration - @types/prismjs
// has no "prismjs/components/*" module declarations.
declare module "prismjs/components/prism-json" {}