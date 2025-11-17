"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadReceipt, printReceipt } from "@/lib/receipt";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    invoiceNumber: string;
    date: string;
    cashier: string;
    customer?: string;
    items: ReceiptItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
  };
}

export function ReceiptPreview({ open, onOpenChange, data }: ReceiptPreviewProps) {
  const handleDownload = () => {
    downloadReceipt(data);
  };

  const handlePrint = () => {
    printReceipt(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt Preview</DialogTitle>
          <DialogDescription>
            Review the receipt before downloading or printing
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div className="receipt-preview border rounded-lg p-6 bg-white max-h-[60vh] overflow-y-auto">
          <div className="text-center space-y-1 mb-4">
            <h2 className="text-xl font-bold">POS SYSTEM</h2>
            <p className="text-xs text-gray-600">Your Business Address</p>
            <p className="text-xs text-gray-600">Phone: +94 XX XXX XXXX</p>
          </div>

          <div className="border-t border-b py-2 mb-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Invoice:</span>
              <span>{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date:</span>
              <span>{data.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Cashier:</span>
              <span>{data.cashier}</span>
            </div>
            {data.customer && (
              <div className="flex justify-between">
                <span className="font-semibold">Customer:</span>
                <span>{data.customer}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-3">
            <div className="flex justify-between text-xs font-semibold mb-2 border-b pb-1">
              <span>Item</span>
              <span className="flex gap-8">
                <span className="w-8 text-center">Qty</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-16 text-right">Total</span>
              </span>
            </div>
            {data.items.map((item, index) => (
              <div key={index} className="flex justify-between text-xs py-1">
                <span className="flex-1">{item.name}</span>
                <span className="flex gap-8">
                  <span className="w-8 text-center">{item.quantity}</span>
                  <span className="w-16 text-right">{item.price.toFixed(2)}</span>
                  <span className="w-16 text-right">{item.subtotal.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>LKR {data.subtotal.toFixed(2)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-LKR {data.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-1">
              <span>TOTAL:</span>
              <span>LKR {data.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Payment Method:</span>
              <span className="font-semibold">{data.paymentMethod}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t text-xs text-gray-600 space-y-1">
            <p>Thank you for your purchase!</p>
            <p>Please come again!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            Print
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
