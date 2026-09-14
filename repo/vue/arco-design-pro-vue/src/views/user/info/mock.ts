import Mock from 'mockjs';
import setupMock, { successResponseWrap } from '@/utils/setup-mock';

setupMock({
  setup() {
    // 最新项目
    Mock.mock(new RegExp('/api/user/my-project/list'), () => {
      const contributors = [
        {
          name: '秦臻宇',
          email: 'qingzhenyu@arco.design',
          avatar:
            '',
        },
        {
          name: '于涛',
          email: 'yuebao@arco.design',
          avatar:
            '',
        },
        {
          name: '宁波',
          email: 'ningbo@arco.design',
          avatar:
            '',
        },
        {
          name: '郑曦月',
          email: 'zhengxiyue@arco.design',
          avatar:
            '',
        },
        {
          name: '宁波',
          email: 'ningbo@arco.design',
          avatar:
            '',
        },
      ];
      const units = [
        {
          name: '企业级产品设计系统',
          description: 'Arco Design System',
        },
        {
          name: '火山引擎智能应用',
          description: 'The Volcano Engine',
        },
        {
          name: 'OCR文本识别',
          description: 'OCR text recognition',
        },
        {
          name: '内容资源管理',
          description: 'Content resource management ',
        },
        {
          name: '今日头条内容管理',
          description: 'Toutiao content management',
        },
        {
          name: '智能机器人',
          description: 'Intelligent Robot Project',
        },
      ];
      return successResponseWrap(
        new Array(6).fill(null).map((_item, index) => ({
          id: index,
          name: units[index].name,
          description: units[index].description,
          peopleNumber: Mock.Random.natural(10, 1000),
          contributors,
        }))
      );
    });

    // 最新动态
    Mock.mock(new RegExp('/api/user/latest-activity'), () => {
      return successResponseWrap(
        new Array(7).fill(null).map((_item, index) => ({
          id: index,
          title: '发布了项目 Arco Design System',
          description: '企业级产品设计系统',
          avatar:
            '',
        }))
      );
    });

    // 访问量
    Mock.mock(new RegExp('/api/user/visits'), () => {
      return successResponseWrap([
        {
          name: '主页访问量',
          visits: 5670,
          growth: 206.32,
        },
        {
          name: '项目访问量',
          visits: 5670,
          growth: 206.32,
        },
      ]);
    });

    // 项目和团队列表
    Mock.mock(new RegExp('/api/user/project-and-team/list'), () => {
      return successResponseWrap([
        {
          id: 1,
          content: '他创建的项目',
        },
        {
          id: 2,
          content: '他参与的项目',
        },
        {
          id: 3,
          content: '他创建的团队',
        },
        {
          id: 4,
          content: '他加入的团队',
        },
      ]);
    });

    // 团队列表
    Mock.mock(new RegExp('/api/user/my-team/list'), () => {
      return successResponseWrap([
        {
          id: 1,
          avatar:
            '',
          name: '火山引擎智能应用团队',
          peopleNumber: Mock.Random.natural(10, 100),
        },
        {
          id: 2,
          avatar:
            '',
          name: '企业级产品设计团队',
          peopleNumber: Mock.Random.natural(5000, 6000),
        },
        {
          id: 3,
          avatar:
            '',
          name: '前端/UE小分队',
          peopleNumber: Mock.Random.natural(10, 5000),
        },
        {
          id: 4,
          avatar:
            '',
          name: '内容识别插件小分队',
          peopleNumber: Mock.Random.natural(10, 100),
        },
      ]);
    });
  },
});
