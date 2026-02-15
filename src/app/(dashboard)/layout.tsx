import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-surface-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pt-16 pb-8 px-4 md:pt-8 md:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
