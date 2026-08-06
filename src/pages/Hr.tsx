import { useQuery } from "@tanstack/react-query";
import { ModulePage, KpiRow, TableCard } from "@/components/common/SharedBlocks";
import { Card, Badge, BarChart } from "@/components/common/primitives";
import { HrService } from "@/services/data";

function LoadingSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-[#1A1A1C]" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-[#A1A1AA]">No data available</p>
    </div>
  );
}

export function HrPage() {
  const employeesQuery = useQuery({
    queryKey: ["hr-employees"],
    queryFn: () => HrService.getEmployees(),
  });

  const departmentsQuery = useQuery({
    queryKey: ["hr-departments"],
    queryFn: () => HrService.getDepartments(),
  });

  const payrollQuery = useQuery({
    queryKey: ["hr-payroll"],
    queryFn: () => HrService.getPayroll(),
  });

  const employees = employeesQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const payroll = payrollQuery.data ?? [];

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));
  const activeCount = employees.filter((e) => e.status === "active").length;
  const totalSalary = employees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0);
  const avgSalary = employees.length > 0 ? totalSalary / employees.length : 0;

  return (
    <ModulePage
      title="HR"
      subtitle="People · Payroll · Performance"
      tabs={[
        {
          key: "emp",
          label: "Employees",
          render: () => {
            if (employeesQuery.isLoading) return <LoadingSkeleton />;
            if (employees.length === 0) return <EmptyState />;
            return (
              <>
                <KpiRow
                  items={[
                    { label: "Headcount", value: String(employees.length), icon: "groups" },
                    { label: "Active", value: String(activeCount), icon: "check_circle" },
                    {
                      label: "Avg salary",
                      value: `$${(avgSalary / 1000).toFixed(0)}k`,
                      icon: "payments",
                    },
                    { label: "Departments", value: String(departments.length), icon: "business" },
                  ]}
                />
                <TableCard
                  title="All employees"
                  columns={[
                    {
                      key: "first_name",
                      label: "Name",
                      render: (r: (typeof employees)[number]) => `${r.first_name} ${r.last_name}`,
                    },
                    { key: "position", label: "Role" },
                    {
                      key: "department_id",
                      label: "Department",
                      render: (r: (typeof employees)[number]) =>
                        deptMap.get(r.department_id ?? "") ?? "—",
                    },
                    { key: "email", label: "Email" },
                    {
                      key: "status",
                      label: "Status",
                      render: (r: (typeof employees)[number]) => (
                        <Badge tone={r.status === "active" ? "success" : "warn"}>{r.status}</Badge>
                      ),
                    },
                  ]}
                  rows={employees}
                />
              </>
            );
          },
        },
        {
          key: "att",
          label: "Attendance",
          render: () => (
            <Card title="Attendance — this week">
              <EmptyState message="Connect a data source to view attendance analytics" />
            </Card>
          ),
        },
        {
          key: "pay",
          label: "Payroll",
          render: () => {
            if (payrollQuery.isLoading) return <LoadingSkeleton />;
            if (payroll.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="Payroll runs"
                columns={[
                  { key: "pay_period_start", label: "Period" },
                  {
                    key: "salary",
                    label: "Total",
                    render: (r: (typeof payroll)[number]) =>
                      `$${((Number(r.salary) + Number(r.bonuses) - Number(r.deductions)) / 1000).toFixed(1)}k`,
                  },
                  { key: "employee_id", label: "Employee ID" },
                  {
                    key: "status",
                    label: "Status",
                    align: "right",
                    render: (r: (typeof payroll)[number]) => (
                      <Badge tone={r.status === "processed" ? "success" : "warn"}>{r.status}</Badge>
                    ),
                  },
                ]}
                rows={payroll}
              />
            );
          },
        },
        {
          key: "leave",
          label: "Leave",
          render: () => {
            if (employeesQuery.isLoading) return <LoadingSkeleton />;
            const onLeave = employees.filter((e) => e.status !== "active");
            if (onLeave.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="Leave requests"
                columns={[
                  {
                    key: "first_name",
                    label: "Employee",
                    render: (r: (typeof employees)[number]) => `${r.first_name} ${r.last_name}`,
                  },
                  { key: "position", label: "Type" },
                  { key: "hire_date", label: "Since" },
                  {
                    key: "status",
                    label: "Status",
                    align: "right",
                    render: (r: (typeof employees)[number]) => (
                      <Badge tone="warn">{r.status}</Badge>
                    ),
                  },
                ]}
                rows={onLeave}
              />
            );
          },
        },
        {
          key: "perf",
          label: "Performance",
          render: () => (
            <Card title="Review cycles">
              <div className="p-5 space-y-3">
                {[
                  "Q4 2025 — In Progress (72% complete)",
                  "Q3 2025 — Complete",
                  "Q2 2025 — Complete",
                ].map((r) => (
                  <div
                    key={r}
                    className="text-sm text-white border-b border-border pb-3 last:border-0"
                  >
                    {r}
                  </div>
                ))}
              </div>
            </Card>
          ),
        },
        {
          key: "rec",
          label: "Recruitment",
          render: () => {
            if (employeesQuery.isLoading) return <LoadingSkeleton />;
            return (
              <TableCard
                title="Open roles"
                columns={[
                  { key: "position", label: "Role" },
                  { key: "email", label: "Contact" },
                  {
                    key: "status",
                    label: "Status",
                    align: "right",
                    render: (r: (typeof employees)[number]) => (
                      <Badge tone="neutral">{r.status}</Badge>
                    ),
                  },
                ]}
                rows={employees.slice(0, 5)}
              />
            );
          },
        },
      ]}
    />
  );
}
