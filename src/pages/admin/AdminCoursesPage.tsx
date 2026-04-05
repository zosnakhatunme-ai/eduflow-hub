import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { AdminCourseListSkeleton } from "@/components/skeletons/AdminSkeleton";
import { ImageUrlInput } from "@/components/ImageUrlInput";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ courseName: "", thumbnail: "", price: 0, overview: "", routinePDF: "", allMaterialsLink: "" });

  const fetchCourses = async () => {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setForm({ courseName: "", thumbnail: "", price: 0, overview: "", routinePDF: "", allMaterialsLink: "" });
    setEditing(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.courseName) { toast.error("Course name required"); return; }
    const data = {
      courseName: form.courseName,
      thumbnail: form.thumbnail,
      price: Number(form.price),
      overview: form.overview.split("\n").filter(Boolean),
      routinePDF: form.routinePDF,
      allMaterialsLink: form.allMaterialsLink,
    };
    try {
      if (editing) {
        await updateDoc(doc(db, "courses", editing.id), data);
        toast.success("Course updated!");
      } else {
        await addDoc(collection(db, "courses"), { ...data, subjects: [], instructors: [], discussionGroups: [], createdAt: Timestamp.now() });
        toast.success("Course added!");
      }
      resetForm();
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEdit = (course: Course) => {
    setForm({
      courseName: course.courseName,
      thumbnail: course.thumbnail,
      price: course.price,
      overview: course.overview?.join("\n") || "",
      routinePDF: course.routinePDF || "",
      allMaterialsLink: course.allMaterialsLink || "",
    });
    setEditing(course);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "courses", id));
    toast.success("Course deleted");
    fetchCourses();
  };

  if (loading) return <AdminCourseListSkeleton />;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Courses</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border border-border p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{editing ? "Edit Course" : "Add Course"}</h3>
            <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
          <input placeholder="Course Name" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
          <ImageUrlInput label="Thumbnail" value={form.thumbnail} onChange={(url) => setForm({ ...form, thumbnail: url })} />
          <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
          <textarea placeholder="Overview (one point per line)" value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm min-h-[80px]" />
          <input placeholder="Routine PDF URL" value={form.routinePDF} onChange={(e) => setForm({ ...form, routinePDF: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
          <input placeholder="All Materials Link" value={form.allMaterialsLink} onChange={(e) => setForm({ ...form, allMaterialsLink: e.target.value })} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
          <button onClick={handleSave} className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">{editing ? "Update" : "Add"} Course</button>
        </div>
      )}

      <div className="space-y-2">
        {courses.map((c) => (
          <div key={c.id} className="p-3 bg-card rounded-lg border border-border flex items-center gap-3">
            {c.thumbnail && <img src={c.thumbnail} alt="" className="w-14 h-14 rounded-md object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{c.courseName}</p>
              <p className="text-xs text-muted-foreground">৳{c.price}</p>
            </div>
            <button onClick={() => handleEdit(c)} className="p-2 rounded-md hover:bg-accent"><Edit className="h-4 w-4 text-muted-foreground" /></button>
            <button onClick={() => handleDelete(c.id)} className="p-2 rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
