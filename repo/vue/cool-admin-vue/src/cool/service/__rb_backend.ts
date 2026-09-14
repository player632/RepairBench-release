/**
 * Offline deterministic fixture backend (harness adaptation AD-4).
 *
 * WHY THIS FILE EXISTS
 * This seed is a pure front end: its whole data plane is an HTTP API served by the companion
 * cool-admin NodeJS backend, addressed through `config.baseUrl`, which is `/api` in a production
 * build (src/config/prod.ts:8-16). The repair harness runs with `[environment] allow_internet=false`
 * against evaluation/serve_static.mjs, whose SPA fallback is deliberately LEFT ON so that
 * history-mode deep links resolve. That combination is actively misleading: every `/api/**` URL
 * answers HTTP 200 with index.html, and src/cool/service/request.ts:123-127 destructures
 * `{ code, data, message }` out of an HTML string, finds `code` falsy and returns the HTML as if it
 * were the payload - so `pageErrors` stays empty while nothing works. Measured consequence
 * (cav/work/probe_raw_with_token.json): src/modules/base/config.ts:82-87 fires
 * `base/comm/person` + `base/comm/permmenu` on boot and src/modules/dict/config.ts:11-13 fires
 * `dict/info/data`, all three come back as HTML, `menu.routes` stays empty, and therefore
 * `/demo/home` and `/demo/crud` - which src/modules/base/store/menu.ts:105-160 can ONLY register
 * from the permmenu payload - fall through to `/:catchAll(.*)` and render the 404 page.
 *
 * WHAT IT DOES
 * It replaces the axios TRANSPORT and nothing else: `request.defaults.adapter` is pointed at
 * `rbAdapter`, a table-driven fixture that answers exactly the endpoints this seed calls, with
 * literal (never generated, never clock-derived) payloads. No store, router guard, component or
 * piece of application logic is modified here, and by design no defect is ever placed in this file:
 * it is environment, not subject.
 *
 * SHAPE CONTRACT
 * The response interceptor (src/cool/service/request.ts:115-135) expects the transport to resolve an
 * axios response whose `.data` is the cool-admin envelope `{ code, data, message }` and returns
 * `data` when `code === 1000`. Paging endpoints must resolve `{ list, pagination: { page, size,
 * total } }` - that is what @cool-vue/crud reads (node_modules/@cool-vue/crud/dist/index.es.js,
 * the `pagination } : data` branch of its response normaliser) and what the seed's own inline
 * example uses (src/modules/demo/views/home/components/hot-goods.vue:52-56).
 */

type RbRow = Record<string, any>;

// --------------------------------------------------------------- fixed literals
// Every value below is a literal. Nothing is derived from Math.random, Date.now or the network, so
// two runs of the same build answer byte-identically (AD-5 pins Math.random separately).

const RB_TOKEN = 'rb-fixture-token-0001';
const RB_REFRESH_TOKEN = 'rb-fixture-refresh-0001';
const RB_EXPIRE = 7200;
const RB_REFRESH_EXPIRE = 604800;

const RB_PERSON: RbRow = {
	id: 1,
	username: 'admin',
	nickName: '管理员',
	avatar: '/logo.png',
	headImg: '/logo.png',
	email: 'admin@cool-js.local',
	phone: '13800000000',
	remark: 'fixture person',
	departmentId: 1,
	roleId: 1,
	status: 1,
	createTime: '2024-01-01 09:00:00',
	updateTime: '2024-01-01 09:00:00',
	permissions: ['base:sys:user:page', 'demo:goods:page'],
	roles: [{ id: 1, name: '超级管理员', label: '超级管理员' }]
};

// src/modules/dict/store/dict.ts:33-42 copies `name` onto `label` and only falls back to `id` when
// `value` is '' | null | undefined, so an explicit numeric `value: 0` survives. The @cool-vue/crud
// TestService rows that the cl-crud demos render carry occupation 0..5
// (node_modules/@cool-vue/crud/dist/index.es.js `const userList`), which is what this table keys on.
const RB_DICT: Record<string, RbRow[]> = {
	occupation: [
		{ id: 101, name: '未知', value: 0, orderNum: 1, parentId: null },
		{ id: 102, name: '前端开发', value: 1, orderNum: 2, parentId: null },
		{ id: 103, name: '后端开发', value: 2, orderNum: 3, parentId: null },
		{ id: 104, name: '测试工程师', value: 3, orderNum: 4, parentId: null },
		{ id: 105, name: '产品经理', value: 4, orderNum: 5, parentId: null },
		{ id: 106, name: 'UI 设计师', value: 5, orderNum: 6, parentId: null }
	],
	status: [
		{ id: 201, name: '关闭', value: 0, orderNum: 1, parentId: null },
		{ id: 202, name: '开启', value: 1, orderNum: 2, parentId: null }
	]
};

// src/modules/base/store/menu.ts:120-152 maps this payload: `path = revisePath(e.router || String(e.id))`,
// `name = `${e.name}-${e.id}``, `meta.label = e.name`, `meta.keepAlive = e.keepAlive || 0`; then
// setRoutes() promotes the FIRST type==1 path (getPath) to `/` + name `home` and pushes a
// `homeRedirect` for its original path. So `/demo/home` is the dashboard AND `/` at the same time,
// and `/demo/crud` stays addressable. `viewPath` is what src/cool/router/index.ts:91-100 resolves
// against its `import.meta.glob('/src/modules/*/{views,pages}/**/*')` table, so it must be the
// glob-relative path WITHOUT the leading `/src/`.
const RB_MENUS: RbRow[] = [
	{
		id: 1,
		parentId: 0,
		type: 0,
		name: '演示',
		router: '/demo',
		icon: 'icon-menu',
		orderNum: 1,
		isShow: true,
		keepAlive: 0,
		viewPath: ''
	},
	{
		id: 2,
		parentId: 1,
		type: 1,
		name: '工作台',
		router: '/demo/home',
		icon: 'home',
		orderNum: 1,
		isShow: true,
		keepAlive: 1,
		viewPath: 'modules/demo/views/home/index.vue'
	},
	{
		id: 3,
		parentId: 1,
		type: 1,
		name: 'CRUD 示例',
		router: '/demo/crud',
		icon: 'icon-component',
		orderNum: 2,
		isShow: true,
		// keepAlive 1 is load-bearing: src/modules/base/pages/main/components/views.vue:29-35 builds
		// the <keep-alive :include> list from process items whose meta.keepAlive is truthy, keyed by
		// path with '/' -> '-', i.e. 'demo-crud', which is exactly the component name declared by
		// defineOptions in src/modules/demo/views/crud/index.vue:2-4. Without it the crud demo tab
		// state could never survive a route change.
		keepAlive: 1,
		viewPath: 'modules/demo/views/crud/index.vue'
	},
	{
		id: 4,
		parentId: 1,
		type: 2,
		name: '查看商品',
		router: '',
		icon: '',
		orderNum: 3,
		isShow: false,
		keepAlive: 0,
		viewPath: '',
		perms: 'demo:goods:page'
	}
];

const RB_PERMS: string[] = [
	'base:comm:person',
	'base:comm:permmenu',
	'base:sys:user:page',
	'base:sys:user:info',
	'base:sys:menu:list',
	'dict:info:data',
	'demo:goods:page',
	'demo:goods:info',
	'user:info:list'
];

// Generic entity tables. Rows are literals; the id sequence is fixed so `/page` and `/list` are
// stable across runs. `add` appends with a deterministic next id derived from the table length,
// never from a clock or a random draw.
function rows(prefix: string, n: number, make: (i: number) => RbRow): RbRow[] {
	const out: RbRow[] = [];
	for (let i = 1; i <= n; i++) {
		out.push(Object.assign({ id: i }, make(i), { createTime: '2024-01-01 09:00:00' }));
	}
	return out;
}

const RB_TABLES: Record<string, RbRow[]> = {
	'/admin/base/sys/user': rows('u', 9, i => ({
		username: `user${i}`,
		nickName: `用户${i}`,
		name: `用户${i}`,
		account: `user${i}`,
		phone: `1380000000${i}`,
		email: `user${i}@cool-js.local`,
		occupation: i % 6,
		status: i % 2,
		wages: 60000 + i * 1000,
		departmentId: (i % 3) + 1,
		roleId: (i % 2) + 1,
		headImg: '/logo.png',
		createTime: `2024-01-0${i} 09:00:00`
	})),
	'/admin/base/sys/menu': [
		{ id: 1, parentId: 0, type: 0, name: '演示', router: '/demo', viewPath: '', orderNum: 1, isShow: true, keepAlive: 0, icon: 'icon-menu' },
		{ id: 2, parentId: 1, type: 1, name: '工作台', router: '/demo/home', viewPath: 'modules/demo/views/home/index.vue', orderNum: 1, isShow: true, keepAlive: 1, icon: 'home' },
		{ id: 3, parentId: 1, type: 1, name: 'CRUD 示例', router: '/demo/crud', viewPath: 'modules/demo/views/crud/index.vue', orderNum: 2, isShow: true, keepAlive: 1, icon: 'icon-component' },
		{ id: 4, parentId: 0, type: 1, name: '字典管理', router: '/dict/list', viewPath: 'modules/dict/views/list.vue', orderNum: 3, isShow: true, keepAlive: 0, icon: 'icon-dict' }
	],
	'/admin/base/sys/role': rows('r', 3, i => ({ name: `角色${i}`, label: `角色${i}`, remark: 'fixture role', status: 1 })),
	'/admin/base/sys/department': rows('d', 3, i => ({ name: `部门${i}`, parentId: 0, orderNum: i })),
	'/admin/base/sys/param': rows('p', 3, i => ({ keyName: `key${i}`, name: `参数${i}`, value: `v${i}`, dataType: 0 })),
	'/admin/base/sys/log': rows('l', 5, i => ({ userId: 1, name: 'admin', action: '查询', method: 'GET', service: '/admin/base/sys/user/page', status: 1, time: 20 + i })),
	'/admin/user/info': rows('ui', 6, i => ({ nickname: `会员${i}`, username: `member${i}`, phone: `1390000000${i}`, status: i % 2, avatar: '/logo.png' })),
	'/admin/user/address': rows('ua', 4, i => ({ userId: i, province: '浙江省', city: '杭州市', area: '西湖区', address: `文一西路 ${i} 号`, isDefault: i === 1 ? 1 : 0 })),
	'/admin/demo/goods': rows('g', 12, i => ({
		title: `商品 ${i}`,
		keyWord: `商品${i}`,
		price: 100 + i * 50,
		count: 900 - i * 37,
		ud: (i % 5) - 2,
		stock: i * 7,
		status: i % 2,
		occupation: i % 6,
		launchDate: `2024-0${(i % 9) + 1}-0${(i % 9) + 1}`,
		createTime: `2024-02-0${(i % 9) + 1} 10:00:00`
	})),
	'/admin/space/info': rows('s', 4, i => ({ url: '/logo.png', name: `文件${i}.png`, type: 'image', size: 1024 * i, typeId: 1 })),
	'/admin/space/type': rows('st', 2, i => ({ name: `分类${i}`, parentId: 0, orderNum: i })),
	'/admin/task/info': rows('t', 3, i => ({ name: `任务${i}`, service: 'demo.task', type: 0, status: i % 2, every: 60000, cron: '' })),
	'/admin/dict/type': rows('dt', 2, i => ({ name: i === 1 ? 'occupation' : 'status', label: i === 1 ? '职业' : '状态' })),
	'/admin/dict/info': Object.keys(RB_DICT).flatMap((k, ki) =>
		RB_DICT[k].map(e => Object.assign({}, e, { typeId: ki + 1, key: k }))
	),
	'/admin/plugin/info': rows('pl', 2, i => ({ name: `插件${i}`, description: 'fixture plugin', version: '1.0.0', status: 1 })),
	'/admin/recycle/data': rows('rc', 2, i => ({ entity: 'DemoGoodsEntity', data: { id: 100 + i, title: `已删除 ${i}` } }))
};

// --------------------------------------------------------------- call accounting
// Harness-only instrumentation of the transport itself. It records what the fixture was asked for so
// the design legs can prove "no endpoint went unanswered" without a network sniffer. It is NOT an
// application surface and no checkpoint reads application state through it.
export const rbBackendState = {
	calls: [] as string[],
	misses: [] as string[],
	reset() {
		this.calls = [];
		this.misses = [];
	}
};

// --------------------------------------------------------------- helpers
function envelope(data: any) {
	return { code: 1000, data };
}

function toPage(list: RbRow[], query: RbRow) {
	const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1);
	const size = Math.max(1, parseInt(String(query.size ?? 10), 10) || 10);
	const total = list.length;
	const start = (page - 1) * size;
	return { list: list.slice(start, start + size), pagination: { page, size, total } };
}

// The seed's own keyword search contract: cl-crud sends `keyWord` and the backend matches it against
// a per-entity field list. Keeping this simple and total (never throwing) is deliberate.
function byKeyWord(list: RbRow[], query: RbRow, fields: string[]) {
	const kw = query.keyWord;
	if (kw === undefined || kw === null || kw === '') {
		return list;
	}
	const needle = String(kw);
	return list.filter(e => fields.some(f => String(e[f] ?? '').includes(needle)));
}

function table(ns: string): RbRow[] {
	if (!RB_TABLES[ns]) {
		RB_TABLES[ns] = [];
	}
	return RB_TABLES[ns];
}

function nextId(list: RbRow[]) {
	return list.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;
}

function clone<T>(v: T): T {
	return JSON.parse(JSON.stringify(v));
}

// --------------------------------------------------------------- dispatch
function dispatch(pathname: string, method: string, query: RbRow, body: any): any {
	const p = pathname.replace(/^\/api/, '');

	// ---- open (no token) ----
	if (p === '/admin/base/open/captcha') {
		// Deterministic SVG (not base64): src/modules/base/pages/login/components/pic-captcha.vue:47-56
		// takes the `svg` branch when `data` has no ';base64,' marker, and only the svg branch renders
		// without an <img src>. The visible text is the verify code the login form must be fed.
		return envelope({
			captchaId: 'rb-captcha-0001',
			data:
				`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="45" viewBox="0 0 150 45">` +
				`<rect width="150" height="45" fill="#2c3142"/>` +
				`<text x="18" y="31" font-size="24" font-family="monospace" fill="#ffffff" letter-spacing="6">RB7Q</text>` +
				`</svg>`
		});
	}
	if (p === '/admin/base/open/login') {
		const username = String((body && body.username) || query.username || '');
		const password = String((body && body.password) || query.password || '');
		const verifyCode = String((body && body.verifyCode) || query.verifyCode || '');
		if (!username) {
			return { code: 1001, message: '用户名不能为空' };
		}
		if (!password) {
			return { code: 1001, message: '密码不能为空' };
		}
		if (verifyCode.toUpperCase() !== 'RB7Q') {
			return { code: 1001, message: '验证码错误' };
		}
		if (username !== 'admin' || password !== '123456') {
			return { code: 1001, message: '用户名或密码错误' };
		}
		return envelope({
			token: RB_TOKEN,
			expire: RB_EXPIRE,
			refreshToken: RB_REFRESH_TOKEN,
			refreshExpire: RB_REFRESH_EXPIRE
		});
	}
	if (p === '/admin/base/open/refreshToken') {
		return envelope({
			token: RB_TOKEN,
			expire: RB_EXPIRE,
			refreshToken: RB_REFRESH_TOKEN,
			refreshExpire: RB_REFRESH_EXPIRE
		});
	}
	if (p === '/admin/base/open/eps') {
		// Only the build-time vite plugin asks for this; answering keeps a stray runtime call harmless.
		return envelope([]);
	}
	if (p === '/admin/base/open/html') {
		return envelope('');
	}

	// ---- comm ----
	if (p === '/admin/base/comm/person') {
		return envelope(clone(RB_PERSON));
	}
	if (p === '/admin/base/comm/personUpdate') {
		Object.assign(RB_PERSON, body || {});
		return envelope(clone(RB_PERSON));
	}
	if (p === '/admin/base/comm/permmenu') {
		return envelope({ menus: clone(RB_MENUS), perms: clone(RB_PERMS) });
	}
	if (p === '/admin/base/comm/uploadMode') {
		return envelope({ mode: 'local', type: 'image' });
	}
	if (p === '/admin/base/comm/upload') {
		return envelope({ url: '/logo.png' });
	}
	if (p === '/admin/base/comm/logout') {
		return envelope(null);
	}
	if (p === '/admin/base/comm/program') {
		return envelope({ name: 'cool-admin', version: '8.0.0' });
	}

	// ---- dict ----
	if (p === '/admin/dict/info/data') {
		// src/modules/dict/store/dict.ts:25-55 posts `{ types }` and expects `{ [typeKey]: row[] }`.
		// An absent/empty `types` means "everything", which is what the boot call asks for.
		const types = (body && body.types) || query.types;
		const keys =
			Array.isArray(types) && types.length ? types.map(String) : Object.keys(RB_DICT);
		const out: Record<string, RbRow[]> = {};
		for (const k of keys) {
			out[k] = clone(RB_DICT[k] || []);
		}
		return envelope(out);
	}
	if (p === '/admin/dict/info/types') {
		return envelope(Object.keys(RB_DICT));
	}

	// ---- generic entity verbs ----
	const m = p.match(/^(\/admin\/[a-z0-9/]+?)\/(page|list|info|add|update|delete|order|restore|start|stop|once|log|move|create|export|import|clear|setKeep|getKeep|noTenant|noUse|use)$/);
	if (m) {
		const ns = m[1];
		const verb = m[2];
		const list = table(ns);

		switch (verb) {
			case 'page':
				return envelope(
					toPage(
						byKeyWord(list, query, ['name', 'nickName', 'username', 'title', 'keyWord', 'phone', 'label']),
						query
					)
				);
			case 'list':
				return envelope(
					clone(byKeyWord(list, query, ['name', 'nickName', 'username', 'title', 'label']))
				);
			case 'info': {
				const id = query.id ?? (body && body.id);
				const hit = list.find(e => String(e.id) === String(id));
				return envelope(hit ? clone(hit) : clone(list[0] || {}));
			}
			case 'add': {
				const created = Object.assign({}, body || {}, { id: nextId(list) });
				list.push(created);
				return envelope({ id: created.id });
			}
			case 'update': {
				const id = (body && body.id) ?? query.id;
				const hit = list.find(e => String(e.id) === String(id));
				if (hit) {
					Object.assign(hit, body || {});
				}
				return envelope(null);
			}
			case 'delete': {
				const raw = (body && body.ids) ?? query.ids;
				const ids = (Array.isArray(raw) ? raw : String(raw ?? '').split(',')).map(String);
				for (let i = list.length - 1; i >= 0; i--) {
					if (ids.includes(String(list[i].id))) {
						list.splice(i, 1);
					}
				}
				return envelope(null);
			}
			case 'order':
				return envelope(null);
			case 'log':
				return envelope('fixture task log');
			default:
				return envelope(null);
		}
	}

	// ---- base/coding (helper plugin market) ----
	if (p === '/admin/base/coding/getModuleTree') {
		return envelope([]);
	}
	if (p === '/admin/base/coding/createCode') {
		return envelope(null);
	}

	return null;
}

/**
 * The axios transport replacement.
 *
 * It answers every URL the seed's `service.*` table can produce. Because src/cool/service/base.ts:15-31
 * composes the URL as `config.baseUrl + '/' + namespace + path`, the string really handed to axios
 * contains a doubled slash (`/api//admin/base/comm/person`), so the path is normalised before
 * matching. Anything unmatched is recorded in `rbBackendState.misses` and answered with an empty
 * payload rather than thrown at: a throw here would surface as a red page for a reason that has
 * nothing to do with the defect under test.
 */
export function rbAdapter(config: any): Promise<any> {
	const rawUrl = String(config.url || '');
	const clean = rawUrl.replace(/\/{2,}/g, '/');
	const pathname = clean.split('?')[0];
	const method = String(config.method || 'get').toLowerCase();

	const query: RbRow = Object.assign({}, config.params || {});
	let body: any = config.data;
	if (typeof body === 'string') {
		try {
			body = JSON.parse(body);
		} catch (e) {
			body = {};
		}
	}
	if (body && typeof body === 'object') {
		Object.assign(query, body);
	}

	rbBackendState.calls.push(method.toUpperCase() + ' ' + pathname);

	const found = dispatch(pathname, method, query, body);
	const payload = found === null ? (rbBackendState.misses.push(pathname), envelope(null)) : found;

	return Promise.resolve({
		data: payload,
		status: 200,
		statusText: 'OK',
		headers: { 'content-type': 'application/json' },
		config,
		request: { rbFixture: true }
	});
}
