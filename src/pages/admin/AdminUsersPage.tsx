import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDoc, EnrollRequest } from "@/types";
import { toast } from "sonner";
import { AdminListSkeleton } from "@/components/skeletons/AdminSkeleton";
import { Check, X, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface UserWithId extends UserDoc { id: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [requests, setRequests] = useState<EnrollRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    const [usersSnap, requestsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "enrollRequests")),
    ]);
    setUsers(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as UserWithId)));
    setRequests(requestsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollRequest)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (req: EnrollRequest) => {
    try {
      await updateDoc(doc(db, "enrollRequests", req.id), { status: "approved" });
      const userRef = doc(db, "users", req.userId);
      const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", req.userId)));
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data() as UserDoc;
        const enrolled = userData.enrolledCourses || [];
        if (!enrolled.find((e) => e.courseId === req.courseId)) {
          enrolled.push({ courseId: req.courseId, enrolledAt: req.createdAt });
        }
        await updateDoc(userRef, { enrolledCourses: enrolled, activeCourseId: req.courseId, status: "approved" });
      }
      toast.success("Student approved!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (req: EnrollRequest) => {
    await updateDoc(doc(db, "enrollRequests", req.id), { status: "rejected" });
    toast.success("Request rejected");
    fetchData();
  };

  const handleDelete = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    toast.success("User deleted");
    fetchData();
  };

  if (loading) return <AdminListSkeleton />;

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const filteredUsers = users.filter((u) => u.role !== "admin" && (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Users</h2>

      <div className="flex border-b border-border mb-4">
        <button onClick={() => setTab("pending")} className={`flex-1 py-2 text-sm font-medium border-b-2 ${tab === "pending" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          Pending ({pendingRequests.length})
        </button>
        <button onClick={() => setTab("all")} className={`flex-1 py-2 text-sm font-medium border-b-2 ${tab === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          All Users ({filteredUsers.length})
        </button>
      </div>

      {tab === "all" && (
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm mb-4" />
      )}

      {tab === "pending" ? (
        pendingRequests.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-3 bg-card rounded-lg border border-border flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{req.userEmail}</p>
                </div>
                <button onClick={() => handleApprove(req)} className="p-2 rounded-md bg-success/10 text-success hover:bg-success/20"><Check className="h-4 w-4" /></button>
                <button onClick={() => handleReject(req)} className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-3 bg-card rounded-lg border border-border flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <button onClick={() => setSelectedUser(u)} className="p-2 rounded-md hover:bg-accent"><Eye className="h-4 w-4 text-muted-foreground" /></button>
              <button onClick={() => handleDelete(u.id)} className="p-2 rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
              <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
              <p><span className="font-medium">Status:</span> {selectedUser.status}</p>
              <p><span className="font-medium">Payment Method:</span> {selectedUser.paymentInfo?.method}</p>
              <p><span className="font-medium">Payment Number:</span> {selectedUser.paymentInfo?.paymentNumber}</p>
              <p><span className="font-medium">Transaction ID:</span> {selectedUser.paymentInfo?.transactionId}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
