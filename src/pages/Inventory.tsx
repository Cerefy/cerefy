import { useQuery } from "@tanstack/react-query";
import { ModulePage, KpiRow, TableCard } from "@/components/common/SharedBlocks";
import { Card, Badge, BarChart } from "@/components/common/primitives";
import { InventoryService } from "@/services/data";

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

export function InventoryPage() {
  const productsQuery = useQuery({
    queryKey: ["inventory-products"],
    queryFn: () => InventoryService.getProducts(),
  });

  const warehousesQuery = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: () => InventoryService.getWarehouses(),
  });

  const suppliersQuery = useQuery({
    queryKey: ["inventory-suppliers"],
    queryFn: () => InventoryService.getSuppliers(),
  });

  const products = productsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];

  const lowStock = products.filter((p) => p.quantity <= p.reorder_level);
  const outOfStock = products.filter((p) => p.quantity === 0);

  return (
    <ModulePage
      title="Inventory"
      subtitle="Stock · Warehouses · Suppliers"
      tabs={[
        {
          key: "prod",
          label: "Products",
          render: () => {
            if (productsQuery.isLoading) return <LoadingSkeleton />;
            if (products.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="Products"
                columns={[
                  { key: "sku", label: "SKU" },
                  { key: "name", label: "Product" },
                  { key: "category", label: "Category" },
                  { key: "quantity", label: "Stock" },
                  {
                    key: "unit_price",
                    label: "Price",
                    align: "right",
                    render: (r: (typeof products)[number]) =>
                      `$${Number(r.unit_price).toLocaleString()}`,
                  },
                ]}
                rows={products}
              />
            );
          },
        },
        {
          key: "stock",
          label: "Stock",
          render: () => {
            if (productsQuery.isLoading) return <LoadingSkeleton />;
            return (
              <>
                <KpiRow
                  items={[
                    { label: "SKUs", value: String(products.length), icon: "inventory_2" },
                    {
                      label: "In stock",
                      value: String(products.length - lowStock.length),
                      delta: `+${products.length - lowStock.length}`,
                      icon: "check_circle",
                    },
                    {
                      label: "Low stock",
                      value: String(lowStock.length),
                      delta: `+${lowStock.length}`,
                      icon: "warning",
                    },
                    { label: "Out of stock", value: String(outOfStock.length), icon: "block" },
                  ]}
                />
                {lowStock.length === 0 ? (
                  <EmptyState />
                ) : (
                  <TableCard
                    title="Low stock"
                    columns={[
                      { key: "sku", label: "SKU" },
                      { key: "name", label: "Product" },
                      { key: "quantity", label: "Stock", align: "right" },
                    ]}
                    rows={lowStock}
                  />
                )}
              </>
            );
          },
        },
        {
          key: "ware",
          label: "Warehouses",
          render: () => {
            if (warehousesQuery.isLoading) return <LoadingSkeleton />;
            if (warehouses.length === 0) return <EmptyState />;
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {warehouses.map((w) => (
                  <div key={w.id} className="bento-card rounded-lg p-5">
                    <div className="text-white text-sm">{w.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
                      {w.location ?? "—"}
                    </div>
                    {w.capacity != null && (
                      <>
                        <div className="mt-4 h-1 bg-border rounded">
                          <div
                            className="h-full bg-white"
                            style={{ width: `${Math.min(100, (w.capacity / 1000) * 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Capacity {w.capacity}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          },
        },
        {
          key: "sup",
          label: "Suppliers",
          render: () => {
            if (suppliersQuery.isLoading) return <LoadingSkeleton />;
            if (suppliers.length === 0) return <EmptyState />;
            return (
              <TableCard
                title="Suppliers"
                columns={[
                  { key: "name", label: "Supplier" },
                  { key: "contact_name", label: "Contact" },
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone", align: "right" },
                ]}
                rows={suppliers}
              />
            );
          },
        },
        {
          key: "an",
          label: "Analytics",
          render: () => (
            <Card title="Turnover — 12w">
              <EmptyState message="Connect a data source to view inventory analytics" />
            </Card>
          ),
        },
      ]}
    />
  );
}
