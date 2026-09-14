import React, { useState, useCallback } from "react";
import { Meta, StoryFn } from "@storybook/react";
import { Sheet } from "@fortune-sheet/core";
import { Workbook } from "@fortune-sheet/react";
import cell from "./data/cell";
import formula from "./data/formula";
import empty from "./data/empty";
import freeze from "./data/freeze";
import dataVerification from "./data/dataVerification";
import lockcellData from "./data/protected";

export default {
  component: Workbook,
} as Meta<typeof Workbook>;

function readoutColName(c: number): string {
  let s = '';
  let n = c;
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function readoutOf(sheets: any[]): any {
  const out: any = { sheets: [], cells: {} };
  for (const sh of sheets || []) {
    out.sheets.push({ name: sh.name, id: sh.id, row: sh.row, column: sh.column });
    const grid = sh.data || [];
    const cellMap: any = {};
    let count = 0;
    for (let r = 0; r < grid.length && count < 60; r += 1) {
      const rowArr = grid[r] || [];
      for (let c = 0; c < rowArr.length && count < 60; c += 1) {
        const cell = rowArr[c];
        if (!cell || (cell.v == null && cell.f == null && cell.m == null)) continue;
        const entry: any = {};
        if (cell.v != null) entry.v = cell.v;
        if (cell.f != null) entry.f = cell.f;
        if (cell.m != null) entry.m = cell.m;
        if (cell.bl) entry.bl = cell.bl;
        if (cell.it) entry.it = cell.it;
        if (cell.un) entry.un = cell.un;
        if (cell.cl) entry.cl = cell.cl;
        cellMap[readoutColName(c) + String(r + 1)] = entry;
        count += 1;
      }
    }
    out.cells[sh.name] = cellMap;
  }
  return out;
}


const Template: StoryFn<typeof Workbook> = ({
  // eslint-disable-next-line react/prop-types
  data: data0,
  ...args
}) => {
  const [data, setData] = useState<Sheet[]>(data0);
  const onChange = useCallback((d: Sheet[]) => {
    setData(d);
  }, []);
  return (
    <>
      <div style={{ width: "100%", height: "100vh" }}>
        <Workbook {...args} data={data} onChange={onChange} />
      </div>
      <div
        data-testid='wb-readout'
        style={{ position: 'fixed', right: 0, bottom: 0, zIndex: 9999, pointerEvents: 'none', fontSize: 10, maxWidth: 420, whiteSpace: 'pre-wrap', background: '#fff', color: '#000' }}
      >
        {JSON.stringify(readoutOf(data))}
      </div>
    </>
  );
};

export const Basic = Template.bind({});
// @ts-ignore
Basic.args = { data: [cell] };

export const Formula = Template.bind({});
// @ts-ignore
Formula.args = { data: [formula] };

export const Empty = Template.bind({});
Empty.args = { data: [empty] };

export const Tabs = Template.bind({});
// @ts-ignore
Tabs.args = { data: [cell, formula] };

export const Freeze = Template.bind({});
// @ts-ignore
Freeze.args = { data: [freeze] };

export const DataVerification = Template.bind({});
// @ts-ignore
DataVerification.args = { data: [dataVerification] };

export const ProtectedSheet = Template.bind({});
// @ts-ignore
ProtectedSheet.args = {
  data: lockcellData,
};

export const MultiInstance: StoryFn<typeof Workbook> = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingRight: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} />
      </div>
      <div
        style={{
          display: "inline-block",
          width: "50%",
          height: "100%",
          paddingLeft: "12px",
          boxSizing: "border-box",
        }}
      >
        <Workbook data={[empty]} />
      </div>
    </div>
  );
};
