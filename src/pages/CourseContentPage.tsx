import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video, Course } from "@/types";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { VideoGridSkeleton } from "@/components/skeletons/VideoCardSkeleton";

export default function CourseContentPage() {
  const { courseId } = useParams();
  const settings = useAppSettings();
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!courseId) return;
    Promise.all([
      getDoc(doc(db, "courses", courseId)),
      getDocs(query(collection(db, "videos"), where("courseId", "==", courseId))),
    ]).then(([courseSnap, videoSnap]) => {
      if (courseSnap.exists()) setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
      setVideos(videoSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Video)));
      setLoading(false);
    });
  }, [courseId]);

  const subjects = course?.subjects || [];
  const filtered = selectedSubject === "all" ? videos : videos.filter((v) => v.subjectId === selectedSubject);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">{course?.courseName || "Course Content"}</h2>

      {subjects.length > 0 && (
        <div ref={chipRef} className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
          <button onClick={() => setSelectedSubject("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedSubject === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
            All
          </button>
          {subjects.map((s) => (
            <button key={s.subjectId} onClick={() => setSelectedSubject(s.subjectId)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${selectedSubject === s.subjectId ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
              {s.subjectName}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <VideoGridSkeleton />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No videos available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((video) => (
            <Link key={video.id} to={`/video/${video.id}`} className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-shadow">
              {video.thumbnail && <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />}
              <div className="p-3">
                <h4 className="text-sm font-medium text-foreground line-clamp-2">{video.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{settings.appName || "LMS"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
