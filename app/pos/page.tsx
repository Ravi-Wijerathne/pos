"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ReceiptPreview } from "@/components/receipt-preview";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  barcode: string | null;
}

interface CartItem extends Product {
  quantity: number;
  subtotal: number;
}

export default function POSPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE">("CASH");
  const [processing, setProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search)
  );

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert("Not enough stock!");
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
    } else {
      if (product.stock === 0) {
        alert("Product out of stock!");
        return;
      }
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          subtotal: product.price,
        },
      ]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity === 0) {
      removeFromCart(productId);
      return;
    }

    if (quantity > product.stock) {
      alert("Not enough stock!");
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      )
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal - discount;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          discount,
          paymentMethod,
          totalAmount: calculateTotal(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Prepare receipt data
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const receiptInfo = {
          invoiceNumber: data.invoiceNumber,
          date: new Date().toLocaleString(),
          cashier: session?.user?.name || "Cashier",
          customer: undefined,
          items: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
          subtotal: subtotal,
          discount: discount,
          total: calculateTotal(),
          paymentMethod: paymentMethod,
        };
        
        setReceiptData(receiptInfo);
        setShowReceipt(true);
        
        // Clear cart
        setCart([]);
        setDiscount(0);
        fetchProducts(); // Refresh stock
      } else {
        alert("Failed to process sale");
      }
    } catch (error) {
      console.error("Error processing sale:", error);
      alert("An error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="col-span-2 space-y-4 overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-gray-600">Select products to add to cart</p>
        </div>

        <Input
          placeholder="Search by name or scan barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-lg"
        />

        <div className="grid h-[calc(100%-8rem)] grid-cols-3 gap-4 overflow-y-auto">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md"
              onClick={() => addToCart(product)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    LKR {Number(product.price).toFixed(2)}
                  </div>
                  <Badge variant={product.stock > 10 ? "default" : "destructive"}>
                    Stock: {product.stock}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="flex flex-col space-y-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[50vh] space-y-3 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500">Cart is empty</p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between space-x-2 border-b pb-2"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        LKR {Number(item.price).toFixed(2)} each
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label>Discount (LKR)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile Payment</option>
                </select>
              </div>

              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>LKR {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckout}
                disabled={processing || cart.length === 0}
              >
                {processing ? "Processing..." : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Preview Dialog */}
      {receiptData && (
        <ReceiptPreview
          open={showReceipt}
          onOpenChange={setShowReceipt}
          data={receiptData}
        />
      )}
    </div>
  );
}
