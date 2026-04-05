import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { examDb } from "@/lib/examFirebase";
import { Exam } from "@/types";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    const snap = await getDocs(collection(examDb, "exams"));
    setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exam)));
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(examDb, "exams", id));
    toast.success("Exam deleted");
    fetchExams();
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Exams</h2>
        <Link to="/admin/exams/add" className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">
          <Plus className="h-4 w-4" /> Add
        </Link>
      </div>
      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="space-y-2">
          {exams.map((e) => (
            <div key={e.id} className="p-3 bg-card rounded-lg border border-border flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.duration} min • {e.questions?.length || 0} questions</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs ${e.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{e.isActive ? "Active" : "Inactive"}</span>
              <button onClick={() => handleDelete(e.id)} className="p-2 rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
