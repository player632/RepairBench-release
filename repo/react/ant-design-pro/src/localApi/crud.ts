// In-memory CRUD stores (adaptation ledger).
// Ports the pagination/add/delete/update semantics of seed mock/listTableList.ts
// and src/pages/list/basic-list/_mock.ts with deterministic generation
// (Math.random/Date.now replaced by constants). State lives in the page bundle:
// it resets on every full page load and persists across SPA re-fetches, which is
// exactly the window a checkpoint interaction needs.

type RuleItem = {
  key: number;
  disabled: boolean;
  href: string;
  avatar: string;
  name: string;
  owner: string;
  desc: string;
  callNo: number;
  status: number;
  updatedAt: string;
  createdAt: string;
  progress: number;
};

const RULE_COUNT = 100;

function genRules(): RuleItem[] {
  const list: RuleItem[] = [];
  for (let i = 0; i < RULE_COUNT; i += 1) {
    list.push({
      key: i,
      disabled: i % 6 === 0,
      href: 'https://ant.design',
      avatar: '/logo.svg',
      name: 'TradeCode ' + i,
      owner: '曲丽丽',
      desc: '这是一段描述',
      callNo: (i * 37) % 1000,
      status: i % 4,
      updatedAt: '2026-01-15',
      createdAt: '2026-01-15',
      progress: ((i * 7) % 100) + 1,
    });
  }
  return list.reverse();
}

let ruleStore: RuleItem[] = genRules();

export function getRules(params: Record<string, unknown>) {
  const current = Number(params.current) || 1;
  const pageSize = Number(params.pageSize) || 10;
  let dataSource = ruleStore.slice();
  const name = params.name ? String(params.name) : '';
  if (name) {
    dataSource = dataSource.filter((item) => item.name.includes(name));
  }
  const paged = dataSource.slice((current - 1) * pageSize, current * pageSize);
  return {
    data: paged,
    total: dataSource.length,
    success: true,
    pageSize,
    current,
  };
}

export function postRule(body: Record<string, any>) {
  const method = body.method;
  if (method === 'delete') {
    const keySrc = body.data && body.data.key !== undefined ? body.data.key : body.key;
    const keys: number[] = Array.isArray(keySrc) ? keySrc : [keySrc];
    ruleStore = ruleStore.filter((item) => keys.indexOf(item.key) === -1);
  } else if (method === 'post') {
    const src = (body.data || body) as Record<string, any>;
    const newRule: RuleItem = {
      key: ruleStore.length,
      href: 'https://ant.design',
      avatar: '/logo.svg',
      name: src.name,
      owner: '曲丽丽',
      desc: src.desc || '',
      callNo: (ruleStore.length * 41) % 1000,
      status: ruleStore.length % 2,
      updatedAt: '2026-01-15',
      createdAt: '2026-01-15',
      progress: ((ruleStore.length * 11) % 100) + 1,
      disabled: false,
    };
    ruleStore.unshift(newRule);
    return newRule;
  } else if (method === 'update') {
    const src = (body.data || body) as Record<string, any>;
    let updated: RuleItem | Record<string, never> = {};
    ruleStore = ruleStore.map((item) => {
      if (item.key === src.key) {
        updated = { ...item, desc: src.desc, name: src.name };
        return { ...item, desc: src.desc, name: src.name };
      }
      return item;
    });
    return updated;
  }
  return {
    list: ruleStore,
    pagination: { total: ruleStore.length },
  };
}

const FAKE_TITLES = [
  'Alipay', 'Angular', 'Ant Design', 'Ant Design Pro',
  'Bootstrap', 'React', 'Vue', 'Webpack',
];
const FAKE_OWNERS = [
  '付小小', '曲丽丽', '林东东', '周星星', '吴加好',
  '朱偏右', '鱼酱', '乐哥', '谭小仪', '仲尼',
];
const FAKE_DESC = [
  '那是一种内在的东西， 他们到达不了，也无法触及的',
  '希望是一个好东西，也许是最好的，好东西是不会消亡的',
  '生命就像一盒巧克力，结果往往出人意料',
  '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
  '那时候我只会想自己想要什么，从不想自己拥有什么',
];
const CREATED_BASE = Date.UTC(2026, 0, 20, 8, 0, 0);

type FakeListItem = {
  id: string;
  owner: string;
  title: string;
  avatar: string;
  cover: string;
  status: string;
  percent: number;
  logo: string;
  href: string;
  updatedAt: number;
  createdAt: number;
  subDescription: string;
  description: string;
  activeUser: number;
  newUser: number;
  star: number;
  like: number;
  message: number;
  content: string;
  members: { avatar: string; name: string; id: string }[];
};

function genFakeList(count: number): FakeListItem[] {
  const list: FakeListItem[] = [];
  for (let i = 0; i < count; i += 1) {
    list.push({
      id: 'fake-list-' + i,
      owner: FAKE_OWNERS[i % FAKE_OWNERS.length],
      title: FAKE_TITLES[i % FAKE_TITLES.length],
      avatar: '/logo.svg',
      cover: '/logo.svg',
      status: ['active', 'exception', 'normal'][i % 3],
      percent: 50 + ((i * 7) % 50),
      logo: '/logo.svg',
      href: 'https://ant.design',
      updatedAt: CREATED_BASE - i * 2 * 60 * 60 * 1000,
      createdAt: CREATED_BASE - i * 2 * 60 * 60 * 1000,
      subDescription: FAKE_DESC[i % 5],
      description: '在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。',
      activeUser: 100000 + ((i * 991) % 100000),
      newUser: 1000 + ((i * 137) % 1000),
      star: 100 + ((i * 29) % 100),
      like: 100 + ((i * 43) % 100),
      message: 10 + ((i * 17) % 10),
      content: '段落示意：蚂蚁集团设计平台 ant.design，用最小的工作量，无缝接入蚂蚁集团生态，提供跨越设计与开发的体验解决方案。',
      members: [
        { avatar: '/logo.svg', name: '曲丽丽', id: 'member1' },
        { avatar: '/logo.svg', name: '王昭君', id: 'member2' },
        { avatar: '/logo.svg', name: '董娜娜', id: 'member3' },
      ],
    });
  }
  return list;
}

let fakeListStore: FakeListItem[] | null = null;

export function getFakeList(count: number): FakeListItem[] {
  if (!fakeListStore) {
    fakeListStore = genFakeList(count || 50);
  }
  return fakeListStore;
}

export function postFakeList(body: Record<string, any>): FakeListItem[] {
  if (!fakeListStore) {
    fakeListStore = genFakeList(50);
  }
  const method = body.method;
  const id = body.id;
  if (method === 'delete') {
    fakeListStore = fakeListStore.filter((item) => item.id !== id);
  } else if (method === 'update') {
    fakeListStore = fakeListStore.map((item) => {
      if (item.id === id) {
        return { ...item, ...body };
      }
      return item;
    });
  } else if (method === 'post') {
    fakeListStore.unshift({
      ...genFakeList(1)[0],
      ...body,
      id: 'fake-list-' + fakeListStore.length,
      createdAt: CREATED_BASE,
      updatedAt: CREATED_BASE,
    });
  }
  return fakeListStore;
}
