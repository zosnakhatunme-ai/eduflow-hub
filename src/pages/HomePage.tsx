import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { Link } from "react-router-dom";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { CourseGridSkeleton } from "@/components/skeletons/CourseCardSkeleton";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = useAppSettings();

  useEffect(() => {
    getDocs(collection(db, "courses")).then((snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
      setLoading(false);
    });
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">All Courses</h1>
      {loading ? (
        <CourseGridSkeleton />
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link key={c.id} to={`/course/${c.id}`} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-card transition-shadow">
              {c.thumbnail && (
                <img src={c.thumbnail} alt={c.courseName} className="w-full aspect-video object-cover" />
              )}
              <div className="p-4 space-y-1">
                <h3 className="font-semibold text-foreground line-clamp-2">{c.courseName}</h3>
                <p className="text-primary font-bold">৳{c.price}</p>
                <span className="inline-block mt-2 text-xs font-medium text-primary border border-primary/20 rounded-md px-2.5 py-1">
                  View Details
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
