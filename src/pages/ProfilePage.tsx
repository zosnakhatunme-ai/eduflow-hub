import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, KeyRound } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProfilePage() {
  const { user, userDoc, loading, logout, resetPassword } = useAuth();

  if (!loading && !user) return <Navigate to="/auth" replace />;
  if (loading) return null;

  const handleResetPassword = async () => {
    if (user?.email) {
      await resetPassword(user.email);
      toast.success("Password reset email sent!");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Profile</h2>
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{userDoc?.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="font-medium">{userDoc?.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-medium capitalize">{userDoc?.status}</p>
        </div>
      </div>

      <button onClick={handleResetPassword} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-border text-sm hover:bg-accent transition-colors">
        <KeyRound className="h-4 w-4" /> Reset Password
      </button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-destructive text-destructive-foreground text-sm">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to logout?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
