// 百度统计代码，需自行更换
// RepairBench adaptation A2: src/main.ts calls baidu() in every non-development
// build, and the body deleted by this hunk injected the Baidu Tongji loader
// script into <head> at boot (that tracker host is quoted on the deleted lines
// only, never on an added one, so a static host sweep of the adapted tree
// reports zero external origins). It is a third-party analytics request, so
// the injection is disabled and baidu() becomes a no-op. Nothing else reads
// its return value or the _hmt global, so this is behaviour-neutral offline.
export function baidu() {
  return
}