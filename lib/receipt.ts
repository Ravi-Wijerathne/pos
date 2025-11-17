import jsPDF from "jspdf";

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  cashier: string;
  customer?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
}

export function generateReceiptPDF(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // Thermal printer size
  });

  let y = 10;
  const lineHeight = 5;
  const pageWidth = 80;

  // Header - Store Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("POS SYSTEM", pageWidth / 2, y, { align: "center" });
  y += lineHeight + 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Your Business Address", pageWidth / 2, y, { align: "center" });
  y += lineHeight;
  doc.text("Phone: +94 XX XXX XXXX", pageWidth / 2, y, { align: "center" });
  y += lineHeight + 3;

  // Line separator
  doc.line(5, y, pageWidth - 5, y);
  y += lineHeight;

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice: ${data.invoiceNumber}`, 5, y);
  y += lineHeight;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Date: ${data.date}`, 5, y);
  y += lineHeight;
  doc.text(`Cashier: ${data.cashier}`, 5, y);
  y += lineHeight;
  
  if (data.customer) {
    doc.text(`Customer: ${data.customer}`, 5, y);
    y += lineHeight;
  }

  y += 2;
  doc.line(5, y, pageWidth - 5, y);
  y += lineHeight;

  // Items Header
  doc.setFont("helvetica", "bold");
  doc.text("Item", 5, y);
  doc.text("Qty", 45, y);
  doc.text("Price", 55, y);
  doc.text("Total", 68, y, { align: "right" });
  y += lineHeight;
  doc.line(5, y, pageWidth - 5, y);
  y += lineHeight;

  // Items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  data.items.forEach((item) => {
    // Item name (wrap if too long)
    const itemName = item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name;
    doc.text(itemName, 5, y);
    doc.text(`${item.quantity}`, 45, y);
    doc.text(`${item.price.toFixed(2)}`, 55, y);
    doc.text(`${item.subtotal.toFixed(2)}`, 68, y, { align: "right" });
    y += lineHeight;
  });

  y += 2;
  doc.line(5, y, pageWidth - 5, y);
  y += lineHeight;

  // Totals
  doc.text("Subtotal:", 5, y);
  doc.text(`LKR ${data.subtotal.toFixed(2)}`, 68, y, { align: "right" });
  y += lineHeight;

  if (data.discount > 0) {
    doc.text("Discount:", 5, y);
    doc.text(`-LKR ${data.discount.toFixed(2)}`, 68, y, { align: "right" });
    y += lineHeight;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL:", 5, y);
  doc.text(`LKR ${data.total.toFixed(2)}`, 68, y, { align: "right" });
  y += lineHeight + 2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Payment: ${data.paymentMethod}`, 5, y);
  y += lineHeight + 3;

  // Footer
  doc.line(5, y, pageWidth - 5, y);
  y += lineHeight;
  doc.text("Thank you for your purchase!", pageWidth / 2, y, { align: "center" });
  y += lineHeight;
  doc.text("Please come again!", pageWidth / 2, y, { align: "center" });

  return doc;
}

export function downloadReceipt(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  doc.save(`receipt-${data.invoiceNumber}.pdf`);
}

export function printReceipt(data: ReceiptData) {
  const doc = generateReceiptPDF(data);
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  
  // Open in new window for printing
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}
