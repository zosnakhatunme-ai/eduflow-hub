import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video, Course } from "@/types";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { AdminVideoListSkeleton } from "@/components/skeletons/AdminSkeleton";

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState("all");

  const fetchData = async () => {
    const [vSnap, cSnap] = await Promise.all([getDocs(collection(db, "videos")), getDocs(collection(db, "courses"))]);
    setVideos(vSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Video)));
    setCourses(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "videos", id));
    toast.success("Video deleted");
    fetchData();
  };

  if (loading) return <AdminVideoListSkeleton />;

  const filtered = filterCourse === "all" ? videos : videos.filter((v) => v.courseId === filterCourse);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Videos</h2>
        <Link to="/admin/videos/add" className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">
          <Plus className="h-4 w-4" /> Add
        </Link>
      </div>

      <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm mb-4">
        <option value="all">All Courses</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName}</option>)}
      </select>

      <div className="space-y-2">
        {filtered.map((v) => (
          <div key={v.id} className="p-3 bg-card rounded-lg border border-border flex items-center gap-3">
            {v.thumbnail && <img src={v.thumbnail} alt="" className="w-20 h-12 rounded-md object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{v.title}</p>
              <p className="text-xs text-muted-foreground">{courses.find((c) => c.id === v.courseId)?.courseName}</p>
            </div>
            <button onClick={() => handleDelete(v.id)} className="p-2 rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
