// Deterministic fixture data (adaptation ledger).
// Ported from seed mock/* with every random source (Math.random / Date.now /
// mockjs) replaced by constants. Relative-time epoch is fixed at 2025-08-30 so
// dayjs.fromNow renders a stable bucket ('a year ago') until 2027-08-30.
// Remote image URLs are replaced by the local /logo.svg asset.

export const EPOCH = Date.UTC(2025, 7, 30, 0, 0, 0);
const HOUR = 1000 * 60 * 60;

export const currentUserBase = {
  name: 'Serati Ma',
  avatar: '/logo.svg',
  userid: '00000001',
  email: 'antdesign@alipay.com',
  signature: '海纳百川，有容乃大',
  title: '交互专家',
  group: '蚂蚁集团－某某某事业群－某某平台部－某某技术部－UED',
  tags: [
    { key: '0', label: '很有想法的' },
    { key: '1', label: '专注设计' },
    { key: '2', label: '辣~' },
    { key: '3', label: '大长腿' },
    { key: '4', label: '川妹子' },
    { key: '5', label: '海纳百川' },
  ],
  notifyCount: 12,
  unreadCount: 11,
  country: 'China',
  geographic: {
    province: { label: '浙江省', key: '330000' },
    city: { label: '杭州市', key: '330100' },
  },
  address: '西湖区工专路 77 号',
  phone: '0752-268888888',
};

export const projectNotice = [
  {
    id: 'xxx1',
    title: 'Alipay',
    logo: '/logo.svg',
    description: '那是一种内在的东西，他们到达不了，也无法触及的',
    updatedAt: EPOCH,
    member: '科学搬砖组',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx2',
    title: 'Angular',
    logo: '/logo.svg',
    description: '希望是一个好东西，也许是最好的，好东西是不会消亡的',
    updatedAt: EPOCH + 2 * HOUR,
    member: '全组都是吴彦祖',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx3',
    title: 'Ant Design',
    logo: '/logo.svg',
    description: '城镇中有那么多的酒馆，她却偏偏走进了我的酒馆',
    updatedAt: EPOCH + 4 * HOUR,
    member: '中二少女团',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx4',
    title: 'Ant Design Pro',
    logo: '/logo.svg',
    description: '那时候我只会想自己想要什么，从不想自己拥有什么',
    updatedAt: EPOCH + 6 * HOUR,
    member: '程序员日常',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx5',
    title: 'Bootstrap',
    logo: '/logo.svg',
    description: '凛冬将至',
    updatedAt: EPOCH + 8 * HOUR,
    member: '高逼格设计天团',
    href: '',
    memberLink: '',
  },
  {
    id: 'xxx6',
    title: 'React',
    logo: '/logo.svg',
    description: '生命就像一盒巧克力，结果往往出人意料',
    updatedAt: EPOCH + 10 * HOUR,
    member: '骗你来学计算机',
    href: '',
    memberLink: '',
  },
];

const GITHUB = 'https://github.com/';

export const activities = [
  {
    id: 'trend-1',
    updatedAt: EPOCH,
    user: { name: '曲丽丽', avatar: '/logo.svg', link: GITHUB },
    group: { name: '高逼格设计天团', link: GITHUB },
    project: { name: '六月迭代', link: GITHUB },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-2',
    updatedAt: EPOCH + HOUR,
    user: { name: '付小小', avatar: '/logo.svg', link: GITHUB },
    group: { name: '高逼格设计天团', link: GITHUB },
    project: { name: '六月迭代', link: GITHUB },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-3',
    updatedAt: EPOCH + 2 * HOUR,
    user: { name: '林东东', avatar: '/logo.svg', link: GITHUB },
    group: { name: '中二少女团', link: GITHUB },
    project: { name: '六月迭代', link: GITHUB },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-4',
    updatedAt: EPOCH + 3 * HOUR,
    user: { name: '周星星', avatar: '/logo.svg', link: GITHUB },
    project: { name: '5 月日常迭代', link: GITHUB },
    template: '将 @{project} 更新至已发布状态',
  },
  {
    id: 'trend-5',
    updatedAt: EPOCH + 4 * HOUR,
    user: { name: '朱偏右', avatar: '/logo.svg', link: GITHUB },
    project: { name: '工程效能', link: GITHUB },
    comment: { name: '留言', link: GITHUB },
    template: '在 @{project} 发布了 @{comment}',
  },
  {
    id: 'trend-6',
    updatedAt: EPOCH + 5 * HOUR,
    user: { name: '乐哥', avatar: '/logo.svg', link: GITHUB },
    group: { name: '程序员日常', link: GITHUB },
    project: { name: '品牌迭代', link: GITHUB },
    template: '在 @{group} 新建项目 @{project}',
  },
  {
    id: 'trend-7',
    updatedAt: EPOCH + 6 * HOUR,
    user: { name: '谭小仪', avatar: '/logo.svg', link: GITHUB },
    group: { name: '骗你来学计算机', link: GITHUB },
    project: { name: '日常维护', link: GITHUB },
    template: '在 @{group} 新建项目 @{project}',
  },
];

const fakeY = [7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5];
const fakeY2 = [1, 6, 4, 8, 3, 7, 2];
const salesY = [231, 456, 388, 512, 690, 423, 777, 305, 529, 614, 268, 483];

export const chartData = {
  visitData: fakeY.map((y, i) => ({ x: '2026-08-' + String(i + 1).padStart(2, '0'), y })),
  visitData2: fakeY2.map((y, i) => ({ x: '2026-08-' + String(i + 1).padStart(2, '0'), y })),
  salesData: salesY.map((y, i) => ({ x: (i + 1) + '月', y })),
  searchData: Array.from({ length: 50 }, (_, i) => ({
    index: i + 1,
    keyword: '搜索关键词-' + i,
    count: (i * 37) % 1000,
    range: (i * 13) % 100,
    status: i % 2,
  })),
  offlineData: Array.from({ length: 10 }, (_, i) => ({
    name: 'Stores ' + i,
    cvr: ((i % 9) + 1) / 10,
  })),
  offlineChartData: Array.from({ length: 20 }, (_, i) => ({
    x: EPOCH + i * 30 * 60 * 1000,
    y1: ((i * 17) % 100) + 10,
    y2: ((i * 23) % 100) + 10,
  })),
  salesTypeData: [
    { x: '家用电器', y: 4544 },
    { x: '食用酒水', y: 3321 },
    { x: '个护健康', y: 3113 },
    { x: '服饰箱包', y: 2341 },
    { x: '母婴产品', y: 1231 },
    { x: '其他', y: 1231 },
  ],
  salesTypeDataOnline: [
    { x: '家用电器', y: 244 },
    { x: '食用酒水', y: 321 },
    { x: '个护健康', y: 311 },
    { x: '服饰箱包', y: 41 },
    { x: '母婴产品', y: 121 },
    { x: '其他', y: 111 },
  ],
  salesTypeDataOffline: [
    { x: '家用电器', y: 99 },
    { x: '食用酒水', y: 188 },
    { x: '个护健康', y: 344 },
    { x: '服饰箱包', y: 255 },
    { x: '其他', y: 65 },
  ],
  radarData: [
    { name: '个人', label: '引用', value: 10 },
    { name: '个人', label: '口碑', value: 8 },
    { name: '个人', label: '产量', value: 4 },
    { name: '个人', label: '贡献', value: 5 },
    { name: '个人', label: '热度', value: 7 },
    { name: '团队', label: '引用', value: 3 },
    { name: '团队', label: '口碑', value: 9 },
    { name: '团队', label: '产量', value: 6 },
    { name: '团队', label: '贡献', value: 3 },
    { name: '团队', label: '热度', value: 1 },
    { name: '部门', label: '引用', value: 4 },
    { name: '部门', label: '口碑', value: 1 },
    { name: '部门', label: '产量', value: 6 },
    { name: '部门', label: '贡献', value: 5 },
    { name: '部门', label: '热度', value: 7 },
  ],
};

const TAG_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆',
  '苏州', '天津', '长沙', '郑州', '东莞', '青岛', '沈阳', '宁波', '昆明', '大连',
  '厦门', '合肥', '佛山', '福州', '哈尔滨', '济南', '温州', '南宁', '长春', '泉州',
  '石家庄', '贵阳', '南昌', '金华', '常州', '无锡', '嘉兴', '太原', '烟台', '徐州',
];

export const tagsPayload = {
  list: Array.from({ length: 100 }, (_, i) => ({
    name: TAG_CITIES[i % TAG_CITIES.length] + (i >= TAG_CITIES.length ? ' ' + (Math.floor(i / TAG_CITIES.length) + 1) + '区' : ''),
    value: 1 + ((i * 7) % 100),
    type: i % 3,
  })),
};

export const notices = [
  { id: '000000001', avatar: '/logo.svg', title: '你收到了 14 份新周报', datetime: '2017-08-09', type: 'notification' },
  { id: '000000002', avatar: '/logo.svg', title: '你推荐的 曲妮妮 已通过第三轮面试', datetime: '2017-08-08', type: 'notification' },
  { id: '000000003', avatar: '/logo.svg', title: '这种模板可以区分多种通知类型', datetime: '2017-08-07', read: true, type: 'notification' },
  { id: '000000004', avatar: '/logo.svg', title: '左侧图标用于区分不同的类型', datetime: '2017-08-07', type: 'notification' },
  { id: '000000005', avatar: '/logo.svg', title: '内容不要超过两行字，超出时自动截断', datetime: '2017-08-07', type: 'message' },
];
