"use server";

import { redirect } from "next/navigation";

export async function logout() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/logout`, {
    method: "POST",
    cache: "no-store",
  });
  if (res.ok) redirect("/login");
}
