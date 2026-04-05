import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { Users, BookOpen, Video, Clock, ExternalLink } from "lucide-react";
import { AdminDashboardSkeleton } from "@/components/skeletons/AdminSkeleton";

export default function AdminDashboard() {
  const settings = useAppSettings();
  const [stats, setStats] = useState({ students: 0, pending: 0, courses: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "users")),
      getDocs(query(collection(db, "enrollRequests"), where("status", "==", "pending"))),
      getDocs(collection(db, "courses")),
      getDocs(collection(db, "videos")),
    ]).then(([users, pending, courses, videos]) => {
      setStats({ students: users.size, pending: pending.size, courses: courses.size, videos: videos.size });
      setLoading(false);
    });
  }, []);

  if (loading) return <AdminDashboardSkeleton />;

  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, color: "text-blue-500" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Courses", value: stats.courses, icon: BookOpen, color: "text-success" },
    { label: "Videos", value: stats.videos, icon: Video, color: "text-purple-500" },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-lg border border-border p-4">
            <c.icon className={`h-5 w-5 ${c.color} mb-2`} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {settings.youtubeChannel && (
          <a href={settings.youtubeChannel} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border text-sm hover:bg-accent transition-colors">
            YouTube Channel <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </a>
        )}
        {settings.googleDrive && (
          <a href={settings.googleDrive} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border text-sm hover:bg-accent transition-colors">
            Google Drive <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}
