import { Link, useLocation } from "react-router-dom";
import {
  X, LayoutDashboard, Users, BookOpen, Video,
  Settings, LogOut, Download, ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/admin",          icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/users",    icon: Users,           label: "Users" },
  { to: "/admin/courses",  icon: BookOpen,        label: "Courses" },
  { to: "/admin/videos",   icon: Video,           label: "Videos" },
  { to: "/admin/exams",    icon: ClipboardList,   label: "Exams" },
  { to: "/admin/settings", icon: Settings,        label: "Settings" },
  { to: "/admin/data",     icon: Download,        label: "Backup" },
];

function NavLink({ to, icon: Icon, label, onClick, pathname }: {
  to: string; icon: any; label: string; onClick?: () => void; pathname: string;
}) {
  const isActive = to === "/admin" ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
        ${isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
      {label}
    </Link>
  );
}

export function AdminSidebar({ open, onClose }: Props) {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/20 z-50" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 w-64 bg-background z-50 border-r border-border flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} {...item} onClick={onClose} pathname={pathname} />
          ))}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 w-full transition-colors">
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logout</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => { await logout(); onClose(); }}>
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </>
  );
}
