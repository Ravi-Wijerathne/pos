"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";

type DashboardStats = {
  todaySalesAmount: number;
  todaySalesCount: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockProducts: number;
};

type SaleRecord = {
  createdAt: string;
  totalAmount: number;
};

type ProductRecord = {
  stock: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySalesAmount: 0,
    todaySalesCount: 0,
    totalProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sales, products, customers] = await Promise.all([
          apiGet<SaleRecord[]>("/api/sales"),
          apiGet<ProductRecord[]>("/api/products"),
          apiGet<{ id: number }[]>("/api/customers"),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = sales.filter((sale) => new Date(sale.createdAt) >= today);
        const todaySalesAmount = todaySales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

        setStats({
          todaySalesAmount,
          todaySalesCount: todaySales.length,
          totalProducts: products.length,
          totalCustomers: customers.length,
          lowStockProducts: products.filter((product) => Number(product.stock) < 10).length,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, []);

  if (loading) {
    return <div className="space-y-6">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              LKR {Number(stats.todaySalesAmount).toFixed(2)}
            </div>
            <p className="text-xs text-gray-600">
              {stats.todaySalesCount} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-gray-600">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-gray-600">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.lowStockProducts}
            </div>
            <p className="text-xs text-gray-600">Products below 10 units</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
