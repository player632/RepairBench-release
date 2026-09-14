// 配置
const config = {
  secretKey: 'x&S#acLCx', //
  apiHost: '',
  prefix: 'img', // 项目前缀，用于设置localStroage的名称
  resourcesHost: '', // AD-2: offline - local fixture paths resolve against the app origin
  host: '', // AD-2: offline - QR-scan host unused by the verifier surface
  basename: 'editor', // history路由前缀
  env: 'dev',
  templateHost: '', // AD-2: offline - template list served by the package-local stub endpoint
};

// 生产环境参数
if (import.meta.env.PROD) {
  config.env = 'prod';
  config.apiHost = (window as any).apiHost || '';
}

export { config };
