import { beforeEach, describe, expect, it, vi } from "vitest";

const saveMock = vi.fn();
const outputMock = vi.fn();
const textMock = vi.fn();
const lineMock = vi.fn();
const setFontMock = vi.fn();
const setFontSizeMock = vi.fn();

vi.mock("jspdf", () => ({
  default: class JsPDFMock {
    save = saveMock;
    output = outputMock;
    text = textMock;
    line = lineMock;
    setFont = setFontMock;
    setFontSize = setFontSizeMock;
  },
}));

import { downloadReceipt, generateReceiptPDF, printReceipt } from "./receipt";

describe("receipt helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    outputMock.mockReturnValue(new Blob(["pdf"]));
  });

  it("generates a receipt with the key totals and metadata", () => {
    const doc = generateReceiptPDF({
      invoiceNumber: "INV-1",
      date: "2026-04-02",
      cashier: "Cashier One",
      customer: "Walk-in",
      items: [
        {
          name: "Long Product Name That Should Be Trimmed",
          quantity: 2,
          price: 125,
          subtotal: 250,
        },
      ],
      subtotal: 250,
      discount: 25,
      total: 225,
      paymentMethod: "CASH",
    });

    expect(doc).toBeDefined();
    expect(textMock).toHaveBeenCalledWith("Invoice: INV-1", 5, expect.any(Number));
    expect(textMock).toHaveBeenCalledWith("Customer: Walk-in", 5, expect.any(Number));
    expect(textMock).toHaveBeenCalledWith("TOTAL:", 5, expect.any(Number));
    expect(textMock).toHaveBeenCalledWith("LKR 225.00", 68, expect.any(Number), { align: "right" });
  });

  it("saves the generated receipt as a pdf file", () => {
    downloadReceipt({
      invoiceNumber: "INV-2",
      date: "2026-04-02",
      cashier: "Cashier One",
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      paymentMethod: "CARD",
    });

    expect(saveMock).toHaveBeenCalledWith("receipt-INV-2.pdf");
  });

  it("opens the generated receipt in a new window for printing", () => {
    const printMock = vi.fn();
    const openMock = vi
      .spyOn(window, "open")
      .mockReturnValue({ onload: null, print: printMock } as unknown as Window);
    const urlMock = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:receipt");

    printReceipt({
      invoiceNumber: "INV-3",
      date: "2026-04-02",
      cashier: "Cashier One",
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      paymentMethod: "MOBILE",
    });

    expect(outputMock).toHaveBeenCalledWith("blob");
    expect(openMock).toHaveBeenCalledWith("blob:receipt");
    expect(urlMock).toHaveBeenCalled();
  });
});