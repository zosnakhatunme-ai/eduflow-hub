import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { BottomNav } from "@/components/BottomNav";
import { UserSidebar } from "@/components/UserSidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userDoc } = useAuth();
  const isAdmin = userDoc?.role === "admin";
  const { pathname } = useLocation();

  const isExamActive = /^\/exams\/[^/]+$/.test(pathname);

  if (isExamActive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav onMenuClick={() => setSidebarOpen(true)} />

      {isAdmin ? (
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      ) : (
        <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 pb-16 overflow-x-hidden">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
