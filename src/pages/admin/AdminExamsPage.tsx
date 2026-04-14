import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, updateDoc, setDoc } from "firebase/firestore";
import { examDb } from "@/lib/examFirebase";
import { db } from "@/lib/firebase";
import { Exam, ExamSubmission } from "@/types/exam";
import { Course } from "@/types";
import { toast } from "sonner";
import { Trash2, Edit, Eye, Plus, Download, Upload, Trophy, CheckCircle, XCircle, Image, Save, ArrowLeft, ZoomIn, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { ImagePreviewDialog } from "@/components/ImagePreviewDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatTime12 = (d?: Date) => d?.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' }) || "";

const PAGE_SIZE = 15;

export default function AdminExamsPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsExam, setResultsExam] = useState<Exam | null>(null);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeTab, setActiveTab] = useState("exams");
  const [filterCourse, setFilterCourse] = useState("");
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmission | null>(null);
  const [writtenMarks, setWrittenMarks] = useState<Record<string, number>>({});
  const [savingGrade, setSavingGrade] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(examDb, "exams"));
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
    } catch (err) {
      console.error("Error fetching exams:", err);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const snap = await getDocs(collection(db, "courses"));
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    } catch (err) {
      console.error("Error fetching courses:", err);
    }
  };

  useEffect(() => { fetchExams(); fetchCourses(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(examDb, "exams", id));
      toast.success("Exam deleted");
      fetchExams();
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const viewResults = async (exam: Exam) => {
    setResultsExam(exam);
    setGradingSubmission(null);
    try {
      const snap = await getDocs(collection(examDb, "submissions"));
      const subs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as ExamSubmission))
        .filter(s => s.examId === exam.id)
        .sort((a, b) => b.obtainedMarks - a.obtainedMarks);
      setSubmissions(subs);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast.error("Failed to load results");
    }
    setActiveTab("results");
  };

  const openGrading = (sub: ExamSubmission) => {
    setGradingSubmission(sub);
    const marks: Record<string, number> = {};
    sub.answers.forEach(a => {
      if (a.writtenMarksAwarded !== undefined) marks[a.questionId] = a.writtenMarksAwarded;
    });
    setWrittenMarks(marks);
  };

  const saveGrading = async () => {
    if (!gradingSubmission || !resultsExam) return;
    setSavingGrade(true);
    try {
      const updatedAnswers = gradingSubmission.answers.map(a => {
        const q = resultsExam.questions.find(q => q.id === a.questionId);
        if (q?.type === "written" && writtenMarks[a.questionId] !== undefined) {
          return { ...a, writtenMarksAwarded: writtenMarks[a.questionId] };
        }
        return a;
      });

      const mcqMarks = updatedAnswers.filter(a => a.isCorrect).reduce((s, a) => s + a.marks, 0);
      const wrongCount = updatedAnswers.filter(a => a.selectedOption !== undefined && !a.isCorrect).length;
      const negativeTotal = wrongCount * (resultsExam.negativeMark || 0);
      const writtenTotal = Object.values(writtenMarks).reduce((s, m) => s + m, 0);
      const obtainedMarks = Math.max(0, mcqMarks - negativeTotal) + writtenTotal;
      const passed = obtainedMarks >= (resultsExam.passMark || 0);

      await updateDoc(doc(examDb, "submissions", gradingSubmission.id), {
        answers: updatedAnswers,
        obtainedMarks,
        passed,
        writtenGraded: true,
        writtenMarks: writtenTotal,
      });

      toast.success("Grades saved");
      setGradingSubmission(null);
      viewResults(resultsExam);
    } catch (err: any) { toast.error(err.message); }
    setSavingGrade(false);
  };

  const exportExams = (examsToExport: Exam[]) => {
    const data = examsToExport.map(e => {
      const { id, ...rest } = e as any;
      return { id, ...rest };
    });
    const blob = new Blob([JSON.stringify({ exams: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exams-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${examsToExport.length} exam(s) exported`);
  };

  const handleImportExams = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const examsData = data.exams || data;
      const arr = Array.isArray(examsData) ? examsData : [examsData];
      for (const exam of arr) {
        const { id, ...rest } = exam;
        if (id) {
          await setDoc(doc(examDb, "exams", id), rest, { merge: true });
        } else {
          const { addDoc } = await import("firebase/firestore");
          await addDoc(collection(examDb, "exams"), rest);
        }
      }
      toast.success(`${arr.length} exam(s) imported`);
      fetchExams();
    } catch (err: any) { toast.error("Import failed: " + err.message); }
    e.target.value = "";
  };

  const downloadRankingPDF = () => {
    if (!resultsExam || submissions.length === 0) return;
    const passMark = resultsExam.passMark || 0;
    const hasWritten = resultsExam.questions.some(q => q.type === "written");
    let html = `<html><head><meta charset="utf-8"><title>${resultsExam.title} - Rankings</title>
    <style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333}h1{font-size:22px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f5f5f5;text-align:left;padding:10px;border-bottom:2px solid #ddd}td{padding:10px;border-bottom:1px solid #eee}.pass{color:#2e7d32;font-weight:600}.fail{color:#c62828;font-weight:600}img{max-height:60px;border-radius:4px}</style></head><body>
    <h1>${resultsExam.title}</h1>
    <h2>${resultsExam.courseName} • Total: ${resultsExam.totalMarks} • Pass: ${passMark}</h2>
    <table><tr><th>Rank</th><th>Name</th><th>Email</th><th>Marks</th><th>Correct</th><th>Wrong</th>${hasWritten ? '<th>Written</th>' : ''}<th>Status</th></tr>`;
    submissions.forEach((sub, idx) => {
      const passed = sub.obtainedMarks >= passMark;
      html += `<tr><td>${idx+1}</td><td>${sub.userName}</td><td>${sub.userEmail}</td><td>${sub.obtainedMarks}/${sub.totalMarks}</td><td>${sub.correctCount}</td><td>${sub.wrongCount}</td>${hasWritten ? `<td>${sub.writtenMarks ?? 'N/A'}</td>` : ''}<td class="${passed?'pass':'fail'}">${passed?'Pass':'Fail'}</td></tr>`;
    });
    html += `</table></body></html>`;
    const w = window.open('','_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };

  const downloadQuestionsPDF = (exam: Exam) => {
    let html = `<html><head><meta charset="utf-8"><title>${exam.title} - Questions & Answers</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333;line-height:1.6}
      h1{font-size:22px;margin-bottom:4px;color:#111}
      h2{font-size:14px;color:#666;margin-bottom:20px}
      .question{margin-bottom:24px;padding:16px;border:1px solid #e0e0e0;border-radius:8px;page-break-inside:avoid}
      .q-header{font-weight:600;font-size:15px;margin-bottom:8px;color:#111}
      .q-type{display:inline-block;font-size:11px;padding:2px 8px;border-radius:10px;background:#f0f0f0;color:#666;margin-left:8px}
      .option{padding:6px 12px;margin:4px 0;border-radius:6px;font-size:13px}
      .correct{background:#e8f5e9;color:#2e7d32;font-weight:600}
      .wrong{background:#fff}
      .answer-label{font-size:12px;color:#888;margin-top:8px;margin-bottom:4px}
      .answer-text{font-size:14px;color:#2e7d32;font-weight:500}
      img{max-height:200px;border-radius:6px;margin:8px 0}
      @media print{.question{break-inside:avoid}}
    </style></head><body>
    <h1>${exam.title}</h1>
    <h2>${exam.courseName} • Total: ${exam.totalMarks} Marks • Duration: ${exam.duration} min • Pass: ${exam.passMark || 0}</h2>`;

    exam.questions.forEach((q, idx) => {
      html += `<div class="question">`;
      html += `<div class="q-header">Q${idx + 1}. ${q.questionText} <span class="q-type">${q.type === "mcq" ? "MCQ" : "Written"} • ${q.marks} marks</span></div>`;
      if (q.questionImage) html += `<img src="${q.questionImage}" alt="Question Image" />`;
      if (q.type === "mcq" && q.options) {
        q.options.forEach((opt, oIdx) => {
          const isCorrect = oIdx === q.correctAnswer;
          html += `<div class="option ${isCorrect ? 'correct' : 'wrong'}">${String.fromCharCode(65 + oIdx)}) ${opt.text} ${isCorrect ? '✓' : ''}</div>`;
          if (opt.image) html += `<img src="${opt.image}" alt="Option" style="max-height:80px;margin-left:20px" />`;
        });
        html += `<div class="answer-label">Correct Answer:</div>`;
        html += `<div class="answer-text">${String.fromCharCode(65 + (q.correctAnswer || 0))}) ${q.options[q.correctAnswer || 0]?.text || ''}</div>`;
      }
      if (q.type === "written") {
        html += `<div class="answer-label">Model Answer:</div>`;
        if (q.writtenAnswer) {
          if (q.writtenAnswer.startsWith("http")) html += `<img src="${q.writtenAnswer}" alt="Answer" />`;
          else html += `<div class="answer-text">${q.writtenAnswer}</div>`;
        } else {
          html += `<div class="answer-text" style="color:#999">No model answer provided</div>`;
        }
      }
      html += `</div>`;
    });
    html += `</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  };

  const filteredExams = filterCourse ? exams.filter(e => e.courseId === filterCourse) : exams;
  const totalPages = Math.ceil(filteredExams.length / PAGE_SIZE);
  const paginatedExams = filteredExams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [filterCourse]);

  const getExamTypeLabel = (exam: Exam) => {
    const hasMcq = exam.questions?.some(q => q.type === "mcq");
    const hasWritten = exam.questions?.some(q => q.type === "written");
    if (hasMcq && hasWritten) return "MCQ + Written";
    if (hasWritten) return "Written";
    return "MCQ";
  };

  // Grading view
  if (gradingSubmission && resultsExam) {
    return (
      <div className="p-4 max-w-2xl mx-auto animate-fade-in">
        <button onClick={() => setGradingSubmission(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </button>
        <h2 className="text-lg font-semibold text-foreground mb-1">Grade Written Answers</h2>
        <p className="text-sm text-muted-foreground mb-4">{gradingSubmission.userName} • {gradingSubmission.userEmail}</p>

        <div className="space-y-4">
          {resultsExam.questions.map((q, idx) => {
            const ans = gradingSubmission.answers.find(a => a.questionId === q.id);
            return (
              <div key={q.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${q.type === "mcq" ? "bg-primary/10 text-primary" : "bg-accent text-muted-foreground border border-border"}`}>
                    {q.type === "mcq" ? "MCQ" : "Written"} • {q.marks} marks
                  </span>
                </div>
                <p className="text-sm text-foreground mb-2">{q.questionText}</p>
                {q.questionImage && (
                  <img src={q.questionImage} alt="" className="h-24 rounded-lg object-contain mb-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setPreviewImage(q.questionImage!)} />
                )}

                {q.type === "mcq" && q.options && (
                  <div className="space-y-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctAnswer;
                      const isSelected = ans?.selectedOption === oIdx;
                      let bg = "bg-card";
                      if (isCorrect) bg = "bg-green-500/10";
                      if (isSelected && !isCorrect) bg = "bg-red-500/10";
                      return (
                        <div key={oIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${bg}`}>
                          {isCorrect && <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />}
                          {isSelected && !isCorrect && <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                          {!isCorrect && !isSelected && <span className="w-3" />}
                          <span className="text-foreground">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.type === "written" && (
                  <div className="mt-2">
                    {ans?.writtenImageUrl ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Student's Answer:</p>
                        <div className="relative inline-block group cursor-pointer" onClick={() => setPreviewImage(ans.writtenImageUrl!)}>
                          <img src={ans.writtenImageUrl} alt="Written answer" className="max-h-64 rounded-lg object-contain border border-border" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <label className="text-xs text-muted-foreground">Marks ({q.marks} max):</label>
                          <input
                            type="number"
                            min={0}
                            max={q.marks}
                            step={0.5}
                            value={writtenMarks[q.id] ?? ""}
                            onChange={e => setWrittenMarks(prev => ({ ...prev, [q.id]: parseFloat(e.target.value) || 0 }))}
                            className="w-20 px-2 py-1 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        {q.writtenAnswer?.startsWith("http") && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Model Answer:</p>
                            <img src={q.writtenAnswer} alt="Model answer" className="max-h-48 rounded-lg object-contain border border-green-300/50 dark:border-green-800/40" onClick={() => setPreviewImage(q.writtenAnswer!)} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No image submitted</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={saveGrading} disabled={savingGrade}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
            <Save className="h-4 w-4" /> {savingGrade ? "Saving..." : "Save Grades"}
          </button>
          <button onClick={() => setGradingSubmission(null)} className="px-4 py-2 bg-accent border border-border rounded-xl text-sm text-foreground">
            Cancel
          </button>
        </div>
        <ImagePreviewDialog src={previewImage} onClose={() => setPreviewImage(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="exams">Exams</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-border rounded-lg text-xs font-medium text-foreground cursor-pointer hover:bg-accent/80">
              <Upload className="h-3.5 w-3.5" /> Import
              <input type="file" accept=".json" className="hidden" onChange={handleImportExams} />
            </label>
            <button
              onClick={() => exportExams(exams)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent/80"
            >
              <Download className="h-3.5 w-3.5" /> Export All
            </button>
            <button
              onClick={() => navigate("/admin/exams/add")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add Exam
            </button>
          </div>
        </div>

        <TabsContent value="exams">
          <div className="mb-3">
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm">
              <option value="">All Courses</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : paginatedExams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No exams found</p>
          ) : (
            <div className="space-y-2">
              {paginatedExams.map(exam => {
                const now = Date.now();
                const start = exam.startTime?.toMillis?.() || 0;
                const end = exam.endTime?.toMillis?.() || 0;
                const status = now < start ? "upcoming" : now <= end ? "live" : "ended";
                const statusConfig = {
                  live: { label: "Live", cls: "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30" },
                  upcoming: { label: "Upcoming", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
                  ended: { label: "Ended", cls: "bg-accent text-muted-foreground border border-border" },
                }[status];

                return (
                  <div key={exam.id} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground leading-snug">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{exam.courseName} • {getExamTypeLabel(exam)} • {exam.questions?.length || 0} Q • {exam.totalMarks} marks • {exam.duration} min</p>
                        {exam.startTime?.toDate && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">🗓 {formatTime12(exam.startTime.toDate())}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusConfig.cls}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Publish toggle */}
                      <button
                        onClick={async () => {
                          try {
                            await updateDoc(doc(examDb, "exams", exam.id), { resultPublished: !exam.resultPublished });
                            setExams(prev => prev.map(e => e.id === exam.id ? { ...e, resultPublished: !e.resultPublished } : e));
                            toast.success(exam.resultPublished ? "Result unpublished" : "Result published");
                          } catch (err: any) { toast.error(err.message); }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          exam.resultPublished
                            ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                            : "bg-accent text-muted-foreground hover:bg-accent/80"
                        }`}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{exam.resultPublished ? "Unpublish" : "Publish"}</span>
                      </button>

                      {/* Right: Action icons */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => downloadQuestionsPDF(exam)}
                          title="Download Q&A PDF"
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => exportExams([exam])}
                          title="Export"
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => viewResults(exam)}
                          title="View Results"
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/exams/add?edit=${exam.id}`)}
                          title="Edit"
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button title="Delete" className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Exam</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(exam.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="p-2 rounded-lg bg-card border border-border disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-card border border-border disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="results">
          {resultsExam ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{resultsExam.title} - Results ({submissions.length})</h3>
                <div className="flex gap-2">
                  <button onClick={downloadRankingPDF} className="flex items-center gap-1 px-3 py-1.5 bg-accent border border-border rounded-lg text-xs font-medium text-foreground">
                    <Download className="h-3 w-3" /> PDF
                  </button>
                  <button onClick={() => setResultsExam(null)} className="text-sm text-muted-foreground hover:text-foreground">Back</button>
                </div>
              </div>
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub, idx) => {
                    const passed = sub.obtainedMarks >= (resultsExam.passMark || 0);
                    const hasWrittenQ = resultsExam.questions.some(q => q.type === "written");
                    return (
                      <div key={sub.id} className="bg-card border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx < 3 ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{sub.userName}</p>
                              <p className="text-xs text-muted-foreground">{sub.userEmail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{sub.obtainedMarks}/{sub.totalMarks}</p>
                            <div className="flex items-center gap-2 justify-end">
                              <p className="text-xs text-muted-foreground">✓{sub.correctCount} ✗{sub.wrongCount}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${passed ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-destructive"}`}>
                                {passed ? "Pass" : "Fail"}
                              </span>
                            </div>
                          </div>
                        </div>
                        {hasWrittenQ && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              Written: {sub.writtenGraded ? `${sub.writtenMarks} marks` : "Not graded"}
                            </span>
                            <button onClick={() => openGrading(sub)} className="flex items-center gap-1 px-3 py-1 bg-accent border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent/80">
                              <Image className="h-3 w-3" /> {sub.writtenGraded ? "Edit Grade" : "Grade"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-card border border-border text-foreground text-sm mb-3">
                <option value="">All Courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}</option>)}
              </select>
              <div className="space-y-2">
                {filteredExams.map(exam => (
                  <button key={exam.id} onClick={() => viewResults(exam)} className="w-full text-left bg-card border border-border rounded-xl p-3 hover:bg-accent transition-colors">
                    <p className="text-sm font-medium text-foreground">{exam.title}</p>
                    <p className="text-xs text-muted-foreground">{exam.courseName} • {exam.questions?.length || 0} Q</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
