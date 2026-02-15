"use server";

import { redirect } from "next/navigation";

export async function logout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    cache: "no-store",
  });
  if (res.ok) redirect("/login");
}
