/* repair-bench offline adaptation for GUI.for.SingBox (Wails = Go backend + Vue frontend).
 * Loaded as a CLASSIC script from index.html <head>, i.e. before the body's inline
 * `if (!window.WailsInvoke)` guard and before any module code, so the app's own
 * `window.runtime.*` / `window.go.bridge.App.*` reads resolve to this deterministic
 * in-page bridge instead of throwing. 0 business logic is edited by this file.
 *
 * Contract sources (read from the seed, not guessed):
 *  - frontend/src/bridge/io.ts, exec.ts, server.ts, mmdb.ts: every binding resolves a
 *    `{ flag, data }` envelope and throws `data` when flag is falsy.
 *  - frontend/src/bridge/net.ts: the HTTP family resolves `{ flag, status, headers, body }`.
 *  - frontend/src/bridge/app.ts: GetEnv / IsStartup / RestartApp / ExitApp / ShowMainWindow /
 *    UpdateTray* resolve their bare value (no envelope).
 *  - io.ts ReadDir / app.ts GetInterfaces / server.ts ListServer: `data` is a '|'-joined string.
 *  - io.ts FileExists: `data` is the STRING 'true' / 'false'.
 *  - utils/migration.ts migrateProfiles dereferences profile.dns.rules, profile.dns.servers,
 *    profile.route.rules, profile.route.rule_set and profile.experimental.cache_file, so the
 *    seeded profiles below carry exactly those containers.
 * Everything is a fixed literal: no Date.now, no Math.random, no network. */
;(function () {
  if (window.__rbWailsStub) return
  var calls = []
  function rec(kind, name, args) {
    try {
      calls.push({
        kind: kind,
        name: name,
        args: Array.prototype.slice.call(args || []).map(function (a) {
          try {
            var s = typeof a === 'function' ? '[fn]' : JSON.stringify(a)
            return (s === undefined ? String(a) : s).slice(0, 240)
          } catch (e) {
            return '[unserializable]'
          }
        }),
      })
    } catch (e) {}
  }

  /* index.html's inline guard only tests truthiness of window.WailsInvoke. */
  window.WailsInvoke = function (ip) {
    rec('WailsInvoke', String(ip), [])
    return Promise.resolve()
  }

  /* Deterministic virtual file system. Writes land back in memory so a checkpoint can
   * observe "the app persisted what the user changed" without touching a real disk. */
  var VFS = {
    'data/user.yaml': '',
    'data/profiles.yaml': [
      '- id: rb-prof-alpha',
      '  name: RB Alpha',
      '  log:',
      '    level: info',
      '  experimental:',
      '    cache_file: {}',
      '  inbounds:',
      '    - id: rb-in-1',
      '      type: mixed',
      '      tag: mixed-in',
      '      enable: true',
      '      mixed:',
      '        listen: 127.0.0.1',
      '        users: []',
      '  outbounds:',
      '    - id: rb-out-1',
      '      type: direct',
      '      tag: direct-out',
      '  route:',
      '    rules: []',
      '    rule_set: []',
      '  dns:',
      '    servers: []',
      '    rules: []',
      '  mixin: {}',
      '  script: {}',
      '- id: rb-prof-beta',
      '  name: RB Beta',
      '  log:',
      '    level: debug',
      '  experimental:',
      '    cache_file: {}',
      '  inbounds: []',
      '  outbounds: []',
      '  route:',
      '    rules: []',
      '    rule_set: []',
      '  dns:',
      '    servers: []',
      '    rules: []',
      '  mixin: {}',
      '  script: {}',
    ].join('\n'),
    'data/subscribes.yaml': [
      '- id: rb-sub-one',
      '  name: RB Sub One',
      '  url: https://rb.invalid/sub.yaml',
      '  upload: 0',
      '  download: 0',
      '  total: 0',
      '  expire: 0',
      '  proxyPrefix: ""',
      '  website: ""',
    ].join('\n'),
    'data/rulesets.yaml': [
      '- id: rb-rs-one',
      '  name: RB Ruleset One',
      '  type: local',
      '  format: source',
      '  tag: rb-rs-one',
      '  path: rb-rs-one.srs',
      '  url: ""',
    ].join('\n'),
    'data/plugins.yaml': '',
    'data/scheduledtasks.yaml': '',
    'data/.cache/plugin-list.json': '[]',
    'data/.cache/ruleset-list.json': '[]',
  }

  function ok(data) {
    return { flag: true, data: data }
  }
  function netOk(body, status) {
    return { flag: true, status: status || 200, headers: {}, body: body == null ? '' : body }
  }
  function has(p) {
    return Object.prototype.hasOwnProperty.call(VFS, p)
  }

  var GO = {
    GetEnv: function () {
      return {
        appName: 'GUI.for.SingBox',
        appVersion: 'v1.26.1',
        basePath: '/rb-vfs',
        appPath: '/rb-vfs/GUI.for.SingBox',
        os: 'darwin',
        arch: 'arm64',
        isPrivileged: false,
      }
    },
    IsStartup: function () {
      return false
    },
    RestartApp: function () {
      return true
    },
    ExitApp: function () {
      return true
    },
    ShowMainWindow: function () {
      return true
    },
    UpdateTray: function () {
      return true
    },
    UpdateTrayMenus: function () {
      return true
    },
    UpdateTrayAndMenus: function () {
      return true
    },
    FileExists: function (a) {
      return ok(has(String(a && a[0])) ? 'true' : 'false')
    },
    ReadFile: function (a) {
      var p = String(a && a[0])
      return ok(has(p) ? VFS[p] : '')
    },
    WriteFile: function (a) {
      VFS[String(a && a[0])] = String(a && a[1] == null ? '' : a[1])
      return ok('')
    },
    ReadDir: function () {
      return ok('')
    },
    MakeDir: function () {
      return ok('')
    },
    AbsolutePath: function (a) {
      return ok('/rb-vfs/' + String(a && a[0]))
    },
    FileSHA256: function () {
      return ok('0000000000000000000000000000000000000000000000000000000000000000')
    },
    MoveFile: function () {
      return ok('')
    },
    CopyFile: function () {
      return ok('')
    },
    RemoveFile: function (a) {
      delete VFS[String(a && a[0])]
      return ok('')
    },
    OpenDir: function () {
      return ok('')
    },
    OpenURI: function () {
      return ok('')
    },
    UnzipZIPFile: function () {
      return ok('')
    },
    UnzipGZFile: function () {
      return ok('')
    },
    UnzipTarGZFile: function () {
      return ok('')
    },
    GetSystemProxy: function () {
      return ok({ http: '', socks: '' })
    },
    GetSystemProxyBypass: function () {
      return ok('')
    },
    SetSystemProxy: function () {
      return ok('')
    },
    SetSystemDNS: function () {
      return ok('')
    },
    GetInterfaces: function () {
      return ok('')
    },
    Exec: function () {
      return ok('')
    },
    ExecBackground: function () {
      return ok({ pid: 4242 })
    },
    ProcessInfo: function () {
      return ok('')
    },
    ProcessMemory: function () {
      return ok('0')
    },
    KillProcess: function () {
      return ok('')
    },
    Requests: function () {
      return netOk('{}')
    },
    Upload: function () {
      return netOk('')
    },
    Download: function () {
      return netOk('')
    },
    TcpPing: function () {
      return ok(1)
    },
    TcpRequest: function () {
      return ok('')
    },
    UdpRequest: function () {
      return ok('')
    },
    OpenMMDB: function () {
      return ok('')
    },
    CloseMMDB: function () {
      return ok('')
    },
    QueryMMDB: function () {
      return ok('{}')
    },
    StartServer: function () {
      return ok('rb-server-1')
    },
    StopServer: function () {
      return ok('')
    },
    ListServer: function () {
      return ok('')
    },
  }

  var RT = {
    IsNotificationAvailable: function () {
      return false
    },
    CheckNotificationAuthorization: function () {
      return { status: 'authorized' }
    },
    RequestNotificationAuthorization: function () {
      return true
    },
    SendNotification: function () {
      return true
    },
    WindowIsMaximised: function () {
      return false
    },
    WindowIsMinimised: function () {
      return false
    },
    WindowIsFullscreen: function () {
      return false
    },
    WindowIsNormal: function () {
      return true
    },
    WindowGetSize: function () {
      return { width: 1440, height: 900 }
    },
    WindowGetPosition: function () {
      return { x: 0, y: 0 }
    },
    ScreenGetAll: function () {
      return []
    },
    Environment: function () {
      return { buildType: 'repair-bench', platform: 'darwin', arch: 'arm64' }
    },
    ClipboardGetText: function () {
      return ''
    },
    ClipboardSetText: function () {
      return true
    },
    CanResolveFilePaths: function () {
      return false
    },
    ResolveFilePaths: function () {
      return true
    },
    BrowserOpenURL: function () {
      return true
    },
    WindowReload: function () {
      return true
    },
    WindowReloadApp: function () {
      return true
    },
    Quit: function () {
      return true
    },
    Hide: function () {
      return true
    },
    Show: function () {
      return true
    },
  }

  window.go = {
    bridge: {
      App: new Proxy(
        {},
        {
          get: function (_t, prop) {
            if (typeof prop !== 'string') return undefined
            return function () {
              var args = arguments
              rec('go.bridge.App', prop, args)
              var fn = GO[prop]
              return Promise.resolve(fn ? fn(args) : ok(null))
            }
          },
        },
      ),
    },
  }

  window.runtime = new Proxy(
    {},
    {
      get: function (_t, prop) {
        if (typeof prop !== 'string') return undefined
        if (/^EventsOn/.test(prop)) {
          return function () {
            rec('runtime', prop, arguments)
            return function () {}
          }
        }
        var fn = RT[prop]
        return function () {
          rec('runtime', prop, arguments)
          return fn ? fn.apply(null, arguments) : undefined
        }
      },
    },
  )

  window.__rbWailsStub = { vfs: VFS, calls: calls, version: 'repair-bench-1' }
})()
