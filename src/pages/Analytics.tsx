import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Bell,
  HelpCircle,
  Calendar,
  BarChart3,
  Download,
  ChevronDown,
  FileText,
  Settings,
  LayoutDashboard,
  MessageSquare,
  Activity,
} from "lucide-react";
import { FinanceService, CrmService, SalesService, HrService } from "@/services/data";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

function SkeletonCard() {
  return (
    <div className="bg-eye-surface border border-eye-border rounded-lg p-6 relative overflow-hidden animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-eye-border/50 rounded" />
          <div className="h-8 w-28 bg-eye-border/50 rounded" />
        </div>
        <div className="h-5 w-16 bg-eye-border/50 rounded" />
      </div>
      <div className="w-full h-12 mt-2 bg-eye-border/20 rounded" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-4 p-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-6 animate-pulse">
          <div className="h-3 w-32 bg-eye-border/50 rounded" />
          <div className="h-3 w-24 bg-eye-border/50 rounded" />
          <div className="h-3 w-16 bg-eye-border/50 rounded" />
          <div className="h-3 w-8 bg-eye-border/50 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-eye-text text-sm font-mono">No {label} data available</p>
    </div>
  );
}

export function AnalyticsPage() {
  const finance = useQuery({
    queryKey: ["finance-summary"],
    queryFn: () => FinanceService.getSummary(),
  });

  const crm = useQuery({
    queryKey: ["crm-summary"],
    queryFn: () => CrmService.getSummary(),
  });

  const sales = useQuery({
    queryKey: ["sales-summary"],
    queryFn: () => SalesService.getSummary(),
  });

  const hr = useQuery({
    queryKey: ["hr-summary"],
    queryFn: () => HrService.getSummary(),
  });

  const isLoading = finance.isLoading || crm.isLoading || sales.isLoading || hr.isLoading;

  return (
import { AppShell } from "@/components/layout/AppShell";

  return (
    <AppShell title="Analytics" subtitle="Enterprise BI">
      <div className="relative min-h-[calc(100vh-80px)]">
        {/* FILTER BAR */}
        <div className="sticky top-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 border-b border-eye-border bg-eye-bg/80 backdrop-blur-md flex items-center justify-between mb-6 z-40">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded cursor-pointer transition-all">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                Last 30 Days
              </span>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded cursor-pointer transition-all">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                All Metrics
              </span>
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-eye-border rounded font-mono text-xs hover:border-primary hover:text-primary transition-all"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
          {/* AMBIENT GLOWS */}
          <div className="fixed top-1/4 right-0 w-[400px] h-[400px] bg-primary/10 blur-[120px] pointer-events-none -z-10" />
          <div className="fixed bottom-1/4 left-64 w-[300px] h-[300px] bg-primary/5 blur-[100px] pointer-events-none -z-10" />

          {/* KPI SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* Revenue */}
                <div
                  data-fade-up
                  className="bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-6 relative overflow-hidden transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p
                        className="font-mono text-xs text-eye-text uppercase"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Total Revenue
                      </p>
                      <h3
                        className="text-3xl font-medium text-white mt-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatCurrency(finance.data?.totalRevenue ?? 0)}
                      </h3>
                    </div>
                    <span
                      className="text-[#38BDF8] font-mono text-[10px] flex items-center bg-[#38BDF8]/10 px-2 py-0.5 rounded"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Net: {formatCurrency(finance.data?.netIncome ?? 0)}
                    </span>
                  </div>
                  <div className="w-full h-12 mt-2">
                    <svg className="w-full h-full" viewBox="0 0 200 40">
                      <path
                        className="sparkline"
                        d="M0,35 Q20,32 40,30 T80,15 T120,25 T160,10 T200,5"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                      <path
                        d="M0,35 Q20,32 40,30 T80,15 T120,25 T160,10 T200,5 L200,40 L0,40 Z"
                        fill="url(#grad-blue)"
                        opacity="0.1"
                      />
                      <defs>
                        <linearGradient id="grad-blue" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
                          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Total Customers */}
                <div
                  data-fade-up
                  className="bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-6 relative overflow-hidden transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p
                        className="font-mono text-xs text-eye-text uppercase"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Total Customers
                      </p>
                      <h3
                        className="text-3xl font-medium text-white mt-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatNumber(crm.data?.totalCustomers ?? 0)}
                      </h3>
                    </div>
                    <span
                      className="text-[#4ade80] font-mono text-[10px] flex items-center bg-[#4ade80]/10 px-2 py-0.5 rounded"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {crm.data?.activeCustomers ?? 0} active
                    </span>
                  </div>
                  <div className="w-full h-12 mt-2">
                    <svg className="w-full h-full" viewBox="0 0 200 40">
                      <path
                        className="sparkline"
                        d="M0,10 Q30,15 60,8 T100,20 T140,12 T180,25 T200,30"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                {/* Sales Orders */}
                <div
                  data-fade-up
                  className="bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-6 relative overflow-hidden transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p
                        className="font-mono text-xs text-eye-text uppercase"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Sales Revenue
                      </p>
                      <h3
                        className="text-3xl font-medium text-white mt-1"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatCurrency(sales.data?.totalRevenue ?? 0)}
                      </h3>
                    </div>
                    <span
                      className="text-[#38BDF8] font-mono text-[10px] flex items-center bg-[#38BDF8]/10 px-2 py-0.5 rounded"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {sales.data?.completedOrders ?? 0} completed
                    </span>
                  </div>
                  <div className="w-full h-12 mt-2">
                    <svg className="w-full h-full" viewBox="0 0 200 40">
                      <path
                        className="sparkline"
                        d="M0,30 Q40,25 80,28 T120,15 T160,18 T200,10"
                        fill="none"
                        stroke="#38BDF8"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MAIN CHART */}
          <div
            data-fade-up
            className="bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Revenue Over Time
                </h2>
                <p
                  className="text-sm text-eye-text mt-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  System-wide node interactions across active clusters.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 font-mono text-[10px] rounded border border-eye-border bg-eye-surface text-primary"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Nodes
                </button>
                <button
                  className="px-3 py-1 font-mono text-[10px] rounded border border-eye-border text-eye-text hover:text-white"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Clusters
                </button>
              </div>
            </div>
            <div className="h-[400px] w-full relative">
              <svg
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 1000 400"
              >
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g className="stroke-eye-border/30" strokeDasharray="4 4" strokeWidth="1">
                  <line x1="0" x2="1000" y1="100" y2="100" />
                  <line x1="0" x2="1000" y1="200" y2="200" />
                  <line x1="0" x2="1000" y1="300" y2="300" />
                </g>
                <path
                  className="sparkline"
                  d="M0,350 C100,320 150,380 250,250 C350,120 450,220 550,150 C650,80 750,120 850,50 C950,-20 1000,50 1000,50"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3"
                />
                <path
                  d="M0,350 C100,320 150,380 250,250 C350,120 450,220 550,150 C650,80 750,120 850,50 C950,-20 1000,50 1000,50 L1000,400 L0,400 Z"
                  fill="url(#chartFill)"
                />
                <circle className="pulse-dot" cx="250" cy="250" fill="#38BDF8" r="4" />
                <circle className="pulse-dot" cx="550" cy="150" fill="#38BDF8" r="4" />
                <circle className="pulse-dot" cx="850" cy="50" fill="#38BDF8" r="4" />
              </svg>
            </div>
            <div className="flex justify-between mt-6 px-2">
              <span
                className="font-mono text-[10px] text-eye-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                01 OCT
              </span>
              <span
                className="font-mono text-[10px] text-eye-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                08 OCT
              </span>
              <span
                className="font-mono text-[10px] text-eye-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                15 OCT
              </span>
              <span
                className="font-mono text-[10px] text-eye-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                22 OCT
              </span>
              <span
                className="font-mono text-[10px] text-eye-text"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                30 OCT
              </span>
            </div>
          </div>

          {/* LOWER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* DEPARTMENT DISTRIBUTION (HR) */}
            <div
              data-fade-up
              className="lg:col-span-4 bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-6 flex flex-col"
            >
              <h2 className="text-xl text-white mb-6" style={{ fontFamily: "var(--font-display)" }}>
                Department Distribution
              </h2>
              <div className="flex-1 flex items-center justify-center relative">
                <div className="w-48 h-48 rounded-full border-[12px] border-eye-surface relative">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="40"
                      stroke="#38BDF8"
                      strokeDasharray="251.2"
                      strokeDashoffset="150"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      opacity="0.6"
                      r="40"
                      stroke="#22d3ee"
                      strokeDasharray="251.2"
                      strokeDashoffset="200"
                      strokeWidth="12"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      opacity="0.4"
                      r="40"
                      stroke="#67e8f9"
                      strokeDasharray="251.2"
                      strokeDashoffset="230"
                      strokeWidth="12"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-lg text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {hr.data?.activeEmployees ?? 0}
                    </span>
                    <span
                      className="font-mono text-[10px] text-eye-text"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      Active Staff
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8">
                {hr.data?.departmentDistribution && hr.data.departmentDistribution.length > 0 ? (
                  hr.data.departmentDistribution.slice(0, 4).map((dept, i) => {
                    const colors = [
                      "bg-[#38BDF8]",
                      "bg-[#22d3ee] opacity-60",
                      "bg-[#67e8f9] opacity-40",
                      "bg-eye-border",
                    ];
                    return (
                      <div key={dept.department} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                        <span
                          className="font-mono text-[11px] text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {dept.department} ({dept.count})
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                      <span
                        className="font-mono text-[11px] text-white"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        No data
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* DATA TABLE: Top Sales */}
            <div
              data-fade-up
              className="lg:col-span-8 bg-eye-surface border border-eye-border hover:border-eye-border-hover rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Sales Summary
                </h2>
                <span
                  className="font-mono text-[10px] text-primary cursor-pointer hover:underline"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  View All Sales
                </span>
              </div>
              {sales.isLoading ? (
                <SkeletonTable />
              ) : sales.data && sales.data.topProducts && sales.data.topProducts.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-eye-border">
                      <th
                        className="pb-4 font-mono text-eye-text text-[11px] uppercase tracking-wider"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Order
                      </th>
                      <th
                        className="pb-4 font-mono text-eye-text text-[11px] uppercase tracking-wider text-right"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Revenue
                      </th>
                      <th
                        className="pb-4 font-mono text-eye-text text-[11px] uppercase tracking-wider text-right"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        % of Total
                      </th>
                      <th
                        className="pb-4 font-mono text-eye-text text-[11px] uppercase tracking-wider text-right"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-eye-border/50">
                    {sales.data.topProducts.map((item) => {
                      const pct =
                        sales.data!.totalRevenue > 0
                          ? ((item.revenue / sales.data!.totalRevenue) * 100).toFixed(1)
                          : "0";
                      return (
                        <tr
                          key={item.name}
                          className="group hover:bg-eye-surface/50 transition-colors"
                        >
                          <td
                            className="py-4 font-mono text-[13px] text-white"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {item.name}
                          </td>
                          <td
                            className="py-4 text-right font-mono text-white"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {formatCurrency(item.revenue)}
                          </td>
                          <td
                            className="py-4 text-right font-mono text-white"
                            style={{ fontFamily: "var(--font-mono)" }}
                          >
                            {pct}%
                          </td>
                          <td className="py-4 text-right">
                            <TrendingUp className="w-4 h-4 text-[#38BDF8] inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <EmptyState label="sales" />
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-8 right-8 z-[100]">
          <div className="bg-eye-surface border border-eye-border px-4 py-3 rounded-full flex items-center shadow-2xl backdrop-blur-xl">
            <div className="w-2 h-2 rounded-full bg-primary pulse-dot mr-3" />
            <span
              className="font-mono text-[12px] text-white"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {crm.data?.activeCustomers ?? 0} Active Customers
            </span>
            <div className="h-4 w-[1px] bg-eye-border mx-3" />
            <span
              className="font-mono text-[10px] text-eye-text uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Real-Time Sync
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
