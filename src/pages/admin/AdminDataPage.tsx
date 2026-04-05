import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function AdminDataPage() {
  const [loading, setLoading] = useState(false);

  const exportData = async () => {
    setLoading(true);
    try {
      const collections = ["users", "courses", "videos", "enrollRequests", "settings"];
      const data: Record<string, any[]> = {};
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        data[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported!");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Data Backup</h2>
      <p className="text-sm text-muted-foreground">Export all data as a JSON file for backup.</p>
      <button onClick={exportData} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
        <Download className="h-4 w-4" /> {loading ? "Exporting..." : "Export All Data"}
      </button>
    </div>
  );
}
