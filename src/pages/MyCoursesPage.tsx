import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { Link, Navigate } from "react-router-dom";
import { useAppSettings } from "@/contexts/AppSettingsContext";

export default function MyCoursesPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const settings = useAppSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDocs(collection(db, "courses")).then((snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
      const enrolled = userDoc?.enrolledCourses?.map((e) => e.courseId) || [];
      setCourses(all.filter((c) => enrolled.includes(c.id)));
      setLoading(false);
    });
  }, [user, userDoc]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">My Courses</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No enrolled courses yet.</p>
          <Link to="/home" className="text-primary hover:underline text-sm mt-2 inline-block">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link key={course.id} to={`/classroom/${course.id}`} className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow">
              {course.thumbnail && <img src={course.thumbnail} alt={course.courseName} className="w-full aspect-video object-cover" />}
              <div className="p-4">
                <h3 className="font-semibold text-foreground">{course.courseName}</h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
