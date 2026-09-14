import { format } from 'date-fns';

// region: mock data

const visitData: any[] = [];
const beginDay = new Date('2026-01-05T08:00:00').getTime();

const fakeY = [7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5];
for (let i = 0; i < fakeY.length; i += 1) {
  visitData.push({
    x: format(new Date(beginDay + 1000 * 60 * 60 * 24 * i), 'yyyy-MM-dd'),
    y: fakeY[i]
  });
}

const visitData2: any[] = [];
const fakeY2 = [1, 6, 4, 8, 3, 7, 2];
for (let i = 0; i < fakeY2.length; i += 1) {
  visitData2.push({
    x: format(new Date(beginDay + 1000 * 60 * 60 * 24 * i), 'yyyy-MM-dd'),
    y: fakeY2[i]
  });
}

const salesData: any[] = [];
for (let i = 0; i < 12; i += 1) {
  salesData.push({
    x: `${i + 1}月`,
    y: 200 + ((i * 137) % 1000)
  });
}
const searchData: any[] = [];
for (let i = 0; i < 50; i += 1) {
  searchData.push({
    index: i + 1,
    keyword: `搜索关键词-${i}`,
    count: (i * 173) % 1000,
    range: (i * 37) % 100,
    status: i % 2
  });
}
const salesTypeData = [
  {
    x: '家用电器',
    y: 4544
  },
  {
    x: '食用酒水',
    y: 3321
  },
  {
    x: '个护健康',
    y: 3113
  },
  {
    x: '服饰箱包',
    y: 2341
  },
  {
    x: '母婴产品',
    y: 1231
  },
  {
    x: '其他',
    y: 1231
  }
];

const salesTypeDataOnline = [
  {
    x: '家用电器',
    y: 244
  },
  {
    x: '食用酒水',
    y: 321
  },
  {
    x: '个护健康',
    y: 311
  },
  {
    x: '服饰箱包',
    y: 41
  },
  {
    x: '母婴产品',
    y: 121
  },
  {
    x: '其他',
    y: 111
  }
];

const salesTypeDataOffline = [
  {
    x: '家用电器',
    y: 99
  },
  {
    x: '个护健康',
    y: 188
  },
  {
    x: '服饰箱包',
    y: 344
  },
  {
    x: '母婴产品',
    y: 255
  },
  {
    x: '其他',
    y: 65
  }
];

const offlineData: any[] = [];
for (let i = 0; i < 10; i += 1) {
  offlineData.push({
    name: `门店${i}`,
    cvr: (((i * 7) % 9) + 1) / 10
  });
}
const offlineChartData: any[] = [];
for (let i = 0; i < 20; i += 1) {
  offlineChartData.push({
    time: beginDay + 1000 * 60 * 30 * i,
    y1: 10 + ((i * 17) % 100),
    y2: 10 + ((i * 23) % 100)
  });
}

const radarOriginData = [
  {
    name: '个人',
    ref: 10,
    koubei: 8,
    output: 4,
    contribute: 5,
    hot: 7
  },
  {
    name: '团队',
    ref: 3,
    koubei: 9,
    output: 6,
    contribute: 3,
    hot: 1
  },
  {
    name: '部门',
    ref: 4,
    koubei: 1,
    output: 6,
    contribute: 5,
    hot: 7
  }
];

//
const radarData: any[] = [];
const radarTitleMap: any = {
  ref: '引用',
  koubei: '口碑',
  output: '产量',
  contribute: '贡献',
  hot: '热度'
};
radarOriginData.forEach((item: any) => {
  Object.keys(item).forEach(key => {
    if (key !== 'name') {
      radarData.push({
        name: item.name,
        label: radarTitleMap[key],
        value: item[key]
      });
    }
  });
});

// endregion

export const CHARTS = {
  '/chart': JSON.parse(
    JSON.stringify({
      visitData,
      visitData2,
      salesData,
      searchData,
      offlineData,
      offlineChartData,
      salesTypeData,
      salesTypeDataOnline,
      salesTypeDataOffline,
      radarData
    })
  ),
  '/chart/visit': JSON.parse(JSON.stringify(visitData)),
  '/chart/tags': {
    list: Array.from({ length: 100 }, (_, i) => ({
      name: `城市${i}`,
      value: ((i * 37) % 100) + 1
    }))
  }
};
