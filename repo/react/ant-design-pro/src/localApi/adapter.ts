// Local API adapter (adaptation ledger).
// Injected as the axios adapter of the @umijs/max request runtime config in
// src/app.tsx so every /api/* call is answered locally with deterministic
// fixture data - the built bundle performs zero network I/O.
//
// Timing contract (deterministic, calibration-anchored):
//   default delay 60ms; /api/login/account 200ms (login flow cadence);
//   /api/monitor/map-geo 300ms (geo point data arrives AFTER the local world
//   topojson fetch so the monitor Map effect observes a two-phase arrival).

import { getCityOptions, provinceOptions } from '@/utils/chinaDivision';
import mapGeoData from '@/pages/dashboard/monitor/mock/map-geo';
import { getFakeList, getRules, postFakeList, postRule } from './crud';
import {
  activities,
  chartData,
  currentUserBase,
  notices,
  projectNotice,
  tagsPayload,
} from './fixtures';
import { getAccess, loginAccount, outLogin } from './session';

const DEFAULT_DELAY = 60;
const DELAYS: Record<string, number> = {
  '/api/login/account': 200,
  '/api/monitor/map-geo': 300,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function respond(config: unknown, data: unknown, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    headers: {},
    config,
  };
}

const usersList = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1 Lake Park' },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 1 Lake Park' },
  { key: '3', name: 'Joe Black', age: 32, address: 'Sidney No. 1 Lake Park' },
];

export async function localApiAdapter(config: any): Promise<any> {
  const url = String(config.url || '');
  const method = String(config.method || 'get').toLowerCase();
  const path = url.split('?')[0];
  let body: Record<string, any> = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      body = {};
    }
  }
  const params: Record<string, unknown> = config.params || {};
  await delay(DELAYS[path] || DEFAULT_DELAY);

  if (method === 'post' && path === '/api/login/account') {
    return respond(config, loginAccount(body.username, body.password, body.type));
  }
  if (method === 'post' && path === '/api/login/outLogin') {
    outLogin();
    return respond(config, { data: {}, success: true });
  }
  if (method === 'post' && path === '/api/login/captcha') {
    return respond(config, { status: 'ok', type: 'mobile', currentAuthority: 'admin' });
  }
  if (method === 'post' && path === '/api/register') {
    return respond(config, { status: 'ok', currentAuthority: 'user' });
  }
  if (path === '/api/currentUser') {
    const access = getAccess();
    if (!access) {
      return respond(
        config,
        { data: { isLogin: false }, errorCode: '401', errorMessage: '请先登录！', success: true },
        401,
      );
    }
    return respond(config, { success: true, data: { ...currentUserBase, access } });
  }
  if (path === '/api/notices') {
    return respond(config, { success: true, data: notices });
  }
  if (path === '/api/users') {
    return respond(config, usersList);
  }
  if (path === '/api/project/notice') {
    return respond(config, { success: true, data: projectNotice });
  }
  if (path === '/api/activities') {
    return respond(config, { success: true, data: activities });
  }
  if (path === '/api/fake_workplace_chart_data') {
    return respond(config, { success: true, data: chartData });
  }
  if (path === '/api/fake_analysis_chart_data') {
    return respond(config, { success: true, data: chartData });
  }
  if (path === '/api/tags') {
    return respond(config, { success: true, data: tagsPayload });
  }
  if (path === '/api/monitor/map-geo') {
    return respond(config, mapGeoData);
  }
  if (path === '/api/rule' && method === 'get') {
    return respond(config, getRules(params));
  }
  if (path === '/api/rule' && method === 'post') {
    return respond(config, postRule(body));
  }
  if (path === '/api/get_list') {
    return respond(config, { data: { list: getFakeList(Number(params.count) || 50) } });
  }
  if (path === '/api/post_fake_list' && method === 'post') {
    return respond(config, { data: { list: postFakeList(body) } });
  }
  if (path === '/api/accountSettingCurrentUser') {
    return respond(config, { data: currentUserBase });
  }
  if (path === '/api/geographic/province') {
    return respond(config, { data: provinceOptions });
  }
  if (path.indexOf('/api/geographic/city/') === 0) {
    const provinceKey = decodeURIComponent(path.slice('/api/geographic/city/'.length));
    return respond(config, { data: getCityOptions(provinceKey) });
  }
  return respond(config, { success: false, errorMessage: 'Not Found: ' + path }, 404);
}
