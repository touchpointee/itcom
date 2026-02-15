import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-gray-50">
      <Sidebar />
      {/* Main: extra padding-top on mobile for hamburger, full width on mobile */}
      <main className="min-w-0 flex-1 overflow-x-hidden pt-14 pb-6 px-4 md:pt-6 md:px-6">
        {children}
      </main>
    </div>
  );
}
