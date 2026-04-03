import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AppRole = "ADMIN" | "CASHIER" | "MANAGER";

export type AppUser = {
  authId: string;
  id: string;
  email: string;
  name: string;
  role: AppRole;
};

function normalizeRole(role: unknown): AppRole {
  if (role === "ADMIN" || role === "CASHIER" || role === "MANAGER") {
    return role;
  }

  return "CASHIER";
}

async function getDatabaseUserByEmail(email: string): Promise<AppUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    return null;
  }

  return {
    authId: user.email,
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
  };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) {
    return null;
  }

  const databaseUser = await getDatabaseUserByEmail(data.user.email);

  if (databaseUser) {
    return {
      ...databaseUser,
      authId: data.user.id,
    };
  }

  return null;
}

export async function requireCurrentUser() {
  return getCurrentUser();
}

export function isAdmin(user: AppUser | null | undefined) {
  return user?.role === "ADMIN";
}