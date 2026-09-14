import { Pie } from '@ant-design/plots';
import { Card, Segmented, Typography } from 'antd';
import React from 'react';
import { formatNumber } from '@/utils/format';
import type { DataItem } from '../data.d';
import useStyles from '../style.style';

const { Text } = Typography;
const ProportionSales = ({
  renderDropdownGroup,
  salesType,
  loading,
  salesPieData,
  handleChangeSalesType,
}: {
  loading: boolean;
  renderDropdownGroup: () => React.ReactNode;
  salesType: 'all' | 'online' | 'stores';
  salesPieData: DataItem[];
  handleChangeSalesType?: (value: 'all' | 'online' | 'stores') => void;
}) => {
  const { styles } = useStyles();
  const pieSum = salesPieData.reduce((acc, item) => acc + (item.y || 0), 0);
  const dropdownGroup = renderDropdownGroup();
  const extra = (
    <div className={styles.salesCardExtra}>
      {dropdownGroup}
      <Segmented
        className={styles.salesTypeRadio}
        data-testid="sales-type-radio"
        value={salesType}
        onChange={handleChangeSalesType}
        options={[
          { label: '全部渠道', value: 'all' },
          {
            label: <span data-testid="sales-type-radio-online">线上</span>,
            value: 'online',
          },
          { label: '门店', value: 'stores' },
        ]}
        size="middle"
      />
    </div>
  );
  return (
    <Card
      loading={loading}
      className={styles.salesCard}
      data-testid="sales-pie"
      data-sum={String(pieSum)}
      variant="borderless"
      title="销售额类别占比"
      style={{
        height: '100%',
      }}
      extra={extra}
    >
      <Text>销售额</Text>
      <Pie
        height={340}
        radius={0.8}
        innerRadius={0.5}
        angleField="y"
        colorField="x"
        data={salesPieData as any}
        legend={false}
        label={{
          position: 'spider',
          text: (item: { x: number; y: number }) =>
            `${item.x}: ${formatNumber(item.y)}`,
        }}
      />
    </Card>
  );
};
export default ProportionSales;
