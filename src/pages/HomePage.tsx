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
      <h2 className="text-xl font-semibold mb-4">All Courses</h2>
      {loading ? (
        <CourseGridSkeleton />
      ) : courses.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No courses available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-md transition-shadow"
            >
              {course.thumbnail && (
                <img src={course.thumbnail} alt={course.courseName} className="w-full aspect-video object-cover" />
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground line-clamp-2">{course.courseName}</h3>
                <p className="text-primary font-bold">৳{course.price}</p>
                <span className="inline-block px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground">
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
