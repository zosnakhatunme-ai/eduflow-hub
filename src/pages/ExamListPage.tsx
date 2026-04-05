import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { examDb } from "@/lib/examFirebase";
import { Exam } from "@/types";
import { Link } from "react-router-dom";
import { ClipboardList, Clock } from "lucide-react";

export default function ExamListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(examDb, "exams"), where("isActive", "==", true))).then((snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Exam)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Exams</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : exams.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No active exams available.</p>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Link key={exam.id} to={`/exams/${exam.id}`} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow">
              <ClipboardList className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium">{exam.title}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" /> {exam.duration} minutes • {exam.questions?.length || 0} questions
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
