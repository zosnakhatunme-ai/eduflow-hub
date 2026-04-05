import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, Timestamp } from "firebase/firestore";
import { examDb } from "@/lib/examFirebase";
import { Exam } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ExamTakePage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, userDoc } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!examId) return;
    getDoc(doc(examDb, "exams", examId)).then((snap) => {
      if (snap.exists()) {
        const e = { id: snap.id, ...snap.data() } as Exam;
        setExam(e);
        setTimeLeft(e.duration * 60);
      }
      setLoading(false);
    });
  }, [examId]);

  useEffect(() => {
    if (timeLeft <= 0 || !exam) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  const handleSubmit = async () => {
    if (!exam || !user || submitting) return;
    setSubmitting(true);
    try {
      let score = 0;
      const totalMarks = exam.questions.reduce((s, q) => s + q.marks, 0);
      exam.questions.forEach((q) => {
        if (q.type !== "written" && answers[q.id] === q.correctAnswer) score += q.marks;
      });
      await addDoc(collection(examDb, "submissions"), {
        examId: exam.id,
        userId: user.uid,
        userName: userDoc?.name || "",
        answers,
        score,
        totalMarks,
        submittedAt: Timestamp.now(),
      });
      toast.success(`Exam submitted! Score: ${score}/${totalMarks}`);
      navigate("/exams", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    }
    setSubmitting(false);
  };

  if (loading) return <p className="text-center py-12 text-muted-foreground">Loading exam...</p>;
  if (!exam) return <p className="text-center py-12 text-muted-foreground">Exam not found.</p>;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{exam.title}</h2>
        <span className={`text-sm font-mono font-bold ${timeLeft < 60 ? "text-destructive" : "text-foreground"}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </span>
      </div>

      <div className="space-y-6">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
            <p className="font-medium text-sm">{i + 1}. {q.question} <span className="text-xs text-muted-foreground">({q.marks} marks)</span></p>
            {q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                    className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${answers[q.id] === oi ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <textarea value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Write your answer..." className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm min-h-[80px]" />
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="w-full mt-6 py-3 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50">
        {submitting ? "Submitting..." : "Submit Exam"}
      </button>
    </div>
  );
}
