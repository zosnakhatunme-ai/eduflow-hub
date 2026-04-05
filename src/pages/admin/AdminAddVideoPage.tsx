import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ImageUrlInput } from "@/components/ImageUrlInput";

export default function AdminAddVideoPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "courses")).then((snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    });
  }, []);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !videoUrl) { toast.error("Fill required fields"); return; }
    setLoading(true);
    try {
      await addDoc(collection(db, "videos"), {
        courseId, subjectId, title, thumbnail, videoUrl, pdfUrl, createdAt: Timestamp.now(),
      });
      toast.success("Video added!");
      navigate("/admin/videos");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Add Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setSubjectId(""); }} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm">
          <option value="">Select Course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
        </select>
        {selectedCourse?.subjects?.length > 0 && (
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm">
            <option value="">Select Subject</option>
            {selectedCourse.subjects.map((s) => <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>)}
          </select>
        )}
        <input placeholder="Video Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
        <ImageUrlInput label="Thumbnail" value={thumbnail} onChange={setThumbnail} />
        <input placeholder="Video URL (YouTube/Direct)" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
        <input placeholder="PDF URL (optional)" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
          {loading ? "Adding..." : "Add Video"}
        </button>
      </form>
    </div>
  );
}
