import { MockRequest } from '@delon/mock';

const list: any[] = [];

for (let i = 0; i < 46; i += 1) {
  list.push({
    key: i,
    disabled: i % 6 === 0,
    href: 'https://ant.design',
    avatar: `./assets/tmp/img/${(i % 6) + 1}.png`,
    no: `TradeCode ${i}`,
    title: `一个任务名称 ${i}`,
    owner: '曲丽丽',
    description: '这是一段描述',
    callNo: (i * 137) % 1000,
    status: i % 4,
    updatedAt: new Date(`2017-07-${i < 18 ? `0${Math.floor(i / 2) + 1}` : Math.floor(i / 2) + 1}`),
    createdAt: new Date(`2017-07-${i < 18 ? `0${Math.floor(i / 2) + 1}` : Math.floor(i / 2) + 1}`),
    progress: ((i * 53) % 100) + 1
  });
}

function getRule(params: any): any[] {
  let ret = [...list];
  if (params.sorter) {
    const s = params.sorter.split('_');
    ret = ret.sort((prev, next) => {
      if (s[1] === 'descend') {
        return next[s[0]] - prev[s[0]];
      }
      return prev[s[0]] - next[s[0]];
    });
  }
  if (params.statusList && params.statusList.length > 0) {
    ret = ret.filter(data => params.statusList.indexOf(data.status) > -1);
  }
  if (params.no) {
    ret = ret.filter(data => data.no.indexOf(params.no) === -1);
  }
  return ret;
}

function removeRule(nos: string): boolean {
  nos.split(',').forEach(no => {
    const idx = list.findIndex(w => w.no === no);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  });
  return true;
}

function saveRule(description: string): void {
  const i = list.length + 1000;
  list.unshift({
    key: i,
    href: 'https://ant.design',
    avatar: `./assets/tmp/img/${(i % 6) + 1}.png`,
    no: `TradeCode ${i}`,
    title: `一个任务名称 ${i}`,
    owner: '曲丽丽',
    description,
    callNo: (i * 137) % 1000,
    status: i % 2,
    updatedAt: new Date('2026-01-06T08:00:00'),
    createdAt: new Date('2026-01-06T08:00:00'),
    progress: ((i * 53) % 100) + 1
  });
}

export const RULES = {
  '/rule': (req: MockRequest) => getRule(req.queryString),
  'DELETE /rule': (req: MockRequest) => removeRule(req.queryString.nos),
  'POST /rule': (req: MockRequest) => saveRule(req.body.description)
};
