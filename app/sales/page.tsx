"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Sale {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentMethod: string;
  createdAt: string;
  customer: { name: string } | null;
  user: { name: string };
  saleItems: Array<{
    quantity: number;
    price: number;
    product: { name: string };
  }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch("/api/sales");
      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error("Error fetching sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-green-600",
      CARD: "bg-blue-600",
      MOBILE: "bg-purple-600",
    };
    return <Badge className={colors[method] || ""}>{method}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales History</h1>
        <p className="text-gray-600">View all transactions</p>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <>
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedSale(
                        expandedSale === sale.id ? null : sale.id
                      )
                    }
                  >
                    <TableCell className="font-medium">
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {sale.customer?.name || "Walk-in"}
                    </TableCell>
                    <TableCell>{sale.user.name}</TableCell>
                    <TableCell>
                      {getPaymentMethodBadge(sale.paymentMethod)}
                    </TableCell>
                    <TableCell className="text-right">
                      LKR {Number(sale.discount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      LKR {Number(sale.totalAmount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {expandedSale === sale.id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50">
                        <div className="space-y-2 p-4">
                          <h4 className="font-semibold">Items:</h4>
                          <div className="space-y-1">
                            {sale.saleItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between text-sm"
                              >
                                <span>
                                  {item.product.name} x {item.quantity}
                                </span>
                                <span>
                                  LKR {(Number(item.price) * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
