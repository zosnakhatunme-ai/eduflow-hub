import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { CourseDetailsSkeleton } from "@/components/skeletons/CourseDetailsSkeleton";
import { ExternalLink, FileText } from "lucide-react";

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    getDoc(doc(db, "courses", courseId)).then((snap) => {
      if (snap.exists()) setCourse({ id: snap.id, ...snap.data() } as Course);
      setLoading(false);
    });
  }, [courseId]);

  if (loading) return <CourseDetailsSkeleton />;
  if (!course) return <p className="text-center py-12 text-muted-foreground">Course not found.</p>;

  const handleEnroll = () => {
    navigate(user ? `/auth?courseId=${course.id}&tab=register` : `/auth?courseId=${course.id}`);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      {course.thumbnail && (
        <img src={course.thumbnail} alt={course.courseName} className="w-full rounded-lg aspect-video object-cover" />
      )}
      <div>
        <h1 className="text-2xl font-bold">{course.courseName}</h1>
        <p className="text-xl font-bold text-primary mt-1">৳{course.price}</p>
      </div>

      {course.overview?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Course Overview</h3>
          <ul className="space-y-1 text-muted-foreground">
            {course.overview.map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {course.instructors?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Instructors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {course.instructors.map((inst, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                {inst.image && <img src={inst.image} alt={inst.name} className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <p className="font-medium">{inst.name}</p>
                  <p className="text-xs text-muted-foreground">{inst.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {course.routinePDF && (
        <a href={course.routinePDF} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline">
          <FileText className="h-4 w-4" /> View Routine PDF <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {settings.paymentMethods?.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-4 space-y-2">
          <h3 className="font-semibold">Payment Information</h3>
          {settings.paymentMethods.map((pm, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{pm.name}:</span> <span className="text-muted-foreground font-mono">{pm.number}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={handleEnroll} className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium">
        Enroll Now
      </button>
    </div>
  );
}
