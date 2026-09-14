// Local session state machine (adaptation ledger).
// Mirrors the access variable of seed mock/user.ts: admin/ant.design -> admin,
// user/ant.design -> user, mobile type -> admin, anything else -> guest.
// The value is persisted to sessionStorage so login survives full page reloads
// (seed mock kept it in the long-lived dev-server process).

export type LoginResult = {
  status?: 'ok' | 'error';
  type?: string;
  currentAuthority?: 'admin' | 'user' | 'guest';
};

const ACCESS_KEY = 'pro_access';

function readStoredAccess(): '' | 'admin' | 'user' {
  try {
    const v = window.sessionStorage.getItem(ACCESS_KEY);
    if (v === 'admin' || v === 'user') return v;
  } catch {
    // storage unavailable: fall back to in-memory only
  }
  return '';
}

function storeAccess(value: '' | 'admin' | 'user'): void {
  try {
    if (value) window.sessionStorage.setItem(ACCESS_KEY, value);
    else window.sessionStorage.removeItem(ACCESS_KEY);
  } catch {
    // ignore
  }
}

let access: '' | 'admin' | 'user' = readStoredAccess();

export const getAccess = (): '' | 'admin' | 'user' => access;

export function loginAccount(
  username: string,
  password: string,
  type: string,
): LoginResult {
  if (password === 'ant.design' && username === 'admin') {
    access = 'admin';
    storeAccess(access);
    return { status: 'ok', type, currentAuthority: 'admin' };
  }
  if (password === 'ant.design' && username === 'user') {
    access = 'user';
    storeAccess(access);
    return { status: 'ok', type, currentAuthority: 'user' };
  }
  if (type === 'mobile') {
    access = 'admin';
    storeAccess(access);
    return { status: 'ok', type, currentAuthority: 'admin' };
  }
  return { status: 'error', type, currentAuthority: 'guest' };
}

export function outLogin(): void {
  access = '';
  storeAccess(access);
}
