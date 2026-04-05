import { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { examDb } from "@/lib/examFirebase";
import { ExamQuestion } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function AdminAddExamPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(30);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { id: genId(), question: "", options: ["", "", "", ""], correctAnswer: 0, marks: 1, type: "mcq" }]);
  };

  const updateQuestion = (index: number, updates: Partial<ExamQuestion>) => {
    const arr = [...questions];
    arr[index] = { ...arr[index], ...updates };
    setQuestions(arr);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || questions.length === 0) { toast.error("Add title and at least one question"); return; }
    setLoading(true);
    try {
      await addDoc(collection(examDb, "exams"), {
        title, duration, questions, isActive: true, createdAt: Timestamp.now(),
      });
      toast.success("Exam created!");
      navigate("/admin/exams");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Add Exam</h2>
      <input placeholder="Exam Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
      <input type="number" placeholder="Duration (minutes)" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-card rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Question {i + 1}</span>
              <button onClick={() => removeQuestion(i)}><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
            <input placeholder="Question" value={q.question} onChange={(e) => updateQuestion(i, { question: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            {q.options?.map((opt, oi) => (
              <div key={oi} className="flex gap-2 items-center">
                <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === oi} onChange={() => updateQuestion(i, { correctAnswer: oi })} />
                <input placeholder={`Option ${oi + 1}`} value={opt} onChange={(e) => {
                  const opts = [...(q.options || [])];
                  opts[oi] = e.target.value;
                  updateQuestion(i, { options: opts });
                }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
              </div>
            ))}
            <input type="number" placeholder="Marks" value={q.marks} onChange={(e) => updateQuestion(i, { marks: Number(e.target.value) })} className="w-24 px-3 py-2 rounded-md border border-border bg-background text-sm" />
          </div>
        ))}
      </div>

      <button onClick={addQuestion} className="flex items-center gap-1 text-sm text-primary"><Plus className="h-4 w-4" /> Add Question</button>
      <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
        {loading ? "Creating..." : "Create Exam"}
      </button>
    </div>
  );
}
