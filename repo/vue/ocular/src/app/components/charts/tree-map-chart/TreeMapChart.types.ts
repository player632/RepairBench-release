export type TreeMapChartNode = {
  id?: string;
  name: string;
  value: number;
  label?: string;
  color?: string;
  children?: TreeMapChartNode[];
};

export type TreeMapChartConfig = {
  nodes: TreeMapChartNode[];
  tooltip?: (id: string) => string | undefined;
};
