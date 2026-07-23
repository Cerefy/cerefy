import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Kpi, Card, DataTable, Tabs } from "@/components/common/primitives";

/* ---------------- Generic module page ---------------- */

export type ModuleTab = { key: string; label: string; render: () => ReactNode };

export function ModulePage({
  title,
  subtitle,
  tabs,
}: {
  title: string;
  subtitle: string;
  tabs: ModuleTab[];
}) {
  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <AppShell title={title} subtitle={subtitle}>
      <Tabs
        tabs={tabs.map(({ key, label }) => ({ key, label }))}
        active={active}
        onChange={setActive}
      />
      {current.render()}
    </AppShell>
  );
}

/* Common blocks used across modules */
export function KpiRow({
  items,
}: {
  items: { label: string; value: string; delta?: string; icon: string }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((i) => (
        <Kpi key={i.label} {...i} />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TableCard<T = any>({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: {
    key: string;
    label: string;
    align?: "left" | "right";
    render?: (row: T) => ReactNode;
  }[];
  rows: T[];
}) {
  return (
    <Card title={title} icon="table_rows">
      <DataTable columns={columns} rows={rows} />
    </Card>
  );
}
