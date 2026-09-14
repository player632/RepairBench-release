// [waveB build-gate shim] replaces Wails Go bindings with a deterministic
// localStorage-backed virtual FS so the Svelte frontend runs headless in a
// static browser context. Signatures mirror wailsjs/go/main/App.d.ts.
const VFS_KEY = "personkanban.vfs.v1";
let lastError = "";

function loadVfs() {
  try {
    const raw = localStorage.getItem(VFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { lastError = String(e); }
  return { files: {}, dirs: { "/": true, "/home": true, "/tmp": true } };
}
function saveVfs(vfs) {
  try { localStorage.setItem(VFS_KEY, JSON.stringify(vfs)); }
  catch (e) { lastError = String(e); }
}
function norm(p) {
  const parts = String(p).split(/[\\/]+/).filter(Boolean);
  return "/" + parts.join("/");
}
function parentOf(p) {
  const i = p.lastIndexOf("/");
  return i <= 0 ? "/" : p.slice(0, i);
}
function mkdirs(vfs, dir) {
  let d = norm(dir);
  const stack = [];
  while (d !== "/" && !vfs.dirs[d]) { stack.push(d); d = parentOf(d); }
  for (const x of stack.reverse()) vfs.dirs[x] = true;
}

export function AppendPath(arg1, arg2) {
  return Promise.resolve(norm(arg1) + "/" + String(arg2).replace(/^[\\/]+/, ""));
}
export function Chmod(arg1, arg2) { return Promise.resolve(); }
export function CreateTempFile(arg1) {
  const vfs = loadVfs();
  const p = "/tmp/tmp-" + Date.now() + String(arg1 || "");
  vfs.files[p] = ""; mkdirs(vfs, parentOf(p)); saveVfs(vfs);
  return Promise.resolve(p);
}
export function DeleteEntries(arg1) {
  const vfs = loadVfs(); const p = norm(arg1);
  for (const k of Object.keys(vfs.files)) if (k === p || k.startsWith(p + "/")) delete vfs.files[k];
  for (const k of Object.keys(vfs.dirs)) if (k === p || k.startsWith(p + "/")) delete vfs.dirs[k];
  saveVfs(vfs); return Promise.resolve();
}
export function DirExists(arg1) {
  const vfs = loadVfs(); const p = norm(arg1);
  return Promise.resolve(Boolean(vfs.dirs[p]) || Object.keys(vfs.files).some((k) => k.startsWith(p + "/")));
}
export function FileExists(arg1) {
  const vfs = loadVfs();
  return Promise.resolve(Object.prototype.hasOwnProperty.call(vfs.files, norm(arg1)));
}
export function GetError() { const e = lastError; lastError = ""; return Promise.resolve(e); }
export function GetExecutable() { return Promise.resolve("/web/personkanban"); }
export function GetGitHubThemes() { return Promise.resolve([]); }
export function GetHomeDir() { return Promise.resolve("/home"); }
export function GetOSName() { return Promise.resolve("web"); }
export function Getwd() { return Promise.resolve("/home"); }
export function MakeDir(arg1) {
  const vfs = loadVfs(); mkdirs(vfs, arg1); saveVfs(vfs);
  return Promise.resolve();
}
export function MakeFile(arg1) {
  const vfs = loadVfs(); const p = norm(arg1);
  if (!(p in vfs.files)) vfs.files[p] = "";
  mkdirs(vfs, parentOf(p)); saveVfs(vfs);
  return Promise.resolve();
}
export function Quit() { return Promise.resolve(); }
export function ReadFile(arg1) {
  const vfs = loadVfs(); const p = norm(arg1);
  if (Object.prototype.hasOwnProperty.call(vfs.files, p)) { lastError = ""; return Promise.resolve(vfs.files[p]); }
  lastError = "file not found: " + p;
  return Promise.resolve("");
}
export function SplitFile(arg1) {
  const p = norm(arg1);
  const i = p.lastIndexOf("/");
  const dir = i <= 0 ? "/" : p.slice(0, i);
  const base = i < 0 ? p : p.slice(i + 1);
  const j = base.lastIndexOf(".");
  return Promise.resolve({ Dir: dir, Name: j <= 0 ? base : base.slice(0, j), Extension: j <= 0 ? "" : base.slice(j) });
}
export function WriteFile(arg1, arg2) {
  const vfs = loadVfs(); const p = norm(arg1);
  vfs.files[p] = String(arg2); mkdirs(vfs, parentOf(p)); saveVfs(vfs); lastError = "";
  return Promise.resolve();
}