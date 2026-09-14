// RepairBench offline adaptation.
// Local no-op replacement for the application's remote database boundary. The exported
// signatures are unchanged; no SDK code executes and no network request is issued.
const RB_STUB_ANY: any =
    typeof window !== 'undefined' ? (window as any).__RB_STUB__ : null;

const rbDbNote = (kind: string, detail?: string) => {
    try {
        if (!RB_STUB_ANY) return;
        if (!RB_STUB_ANY.dbCalls) RB_STUB_ANY.dbCalls = [];
        RB_STUB_ANY.dbCalls.push(kind + (detail ? ' ' + String(detail).slice(0, 120) : ''));
    } catch (e) {
        /* 记账失败绝不影响应用 */
    }
};

// initializeApp(FIREBASE_CONFIG) 被摘掉：不建 app ⇒ getDatabase()/getAuth() 永不被调用 ⇒ 一条连接都不会起。
// FIREBASE_CONFIG（src/config/api.ts）保持原样不动：它是配置数据，不是出入口。

const getRef = (path: string) => ({ path, __rbLocalRef: true });

export const signIntoDatabase = (idToken: string, accessToken: string) => {
    rbDbNote('signInWithCredential:skipped', String(accessToken ? 'has-token' : 'empty-token'));
    return Promise.resolve(undefined as any);
};

export const signOutOfDatabase = () => {
    rbDbNote('signOut:skipped');
    return Promise.resolve(undefined as any);
};

export const saveData = async (path: string, data: string | object) => {
    rbDbNote('set:local-noop', path);
    return undefined;
};

export const subscribeToData = (path: string, callback: Function) => {
    rbDbNote('onValue:never-fires', path);
    // 🔴 故意**永不回调**：RTDB 只要回一个 null 快照，src/store/player/index.ts:34-40 的
    //   `if (!isEqual(queue, currentQueue)) setState('player', { queue })` 就会把播种队列整个清空
    //   （实测隐患，probe 的 P0b 8.5s 稳定性相位就是为它设的）⇒ 不订阅 ⇒ 状态只由 localStorage 决定，跨态可比。
    return () => {
        rbDbNote('off:local-noop', path);
    };
};
