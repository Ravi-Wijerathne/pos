"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "POS", href: "/pos" },
  { name: "Products", href: "/products" },
  { name: "Customers", href: "/customers" },
  { name: "Sales", href: "/sales" },
  { name: "Users", href: "/users", adminOnly: true },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  const isAdmin = user?.role === "ADMIN";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold">POS System</h1>
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-gray-500">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => void signOut().then(() => router.replace("/login"))}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
