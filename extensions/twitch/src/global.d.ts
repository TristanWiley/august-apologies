// Allow importing CSS files as side-effects in TypeScript
// This file tells the compiler the module exists so imports like
// `import "./index.css";` won't error with TS(2882).
declare module "*.css";
