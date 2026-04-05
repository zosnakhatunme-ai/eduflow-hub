import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video } from "@/types";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { VideoPlayerSkeleton } from "@/components/skeletons/VideoPlayerSkeleton";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

function getYouTubeId(url: string) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
  return match?.[1] || "";
}

export default function VideoPlayerPage() {
  const { videoId } = useParams();
  const settings = useAppSettings();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;
    getDoc(doc(db, "videos", videoId)).then(async (snap) => {
      if (snap.exists()) {
        const v = { id: snap.id, ...snap.data() } as Video;
        setVideo(v);
        const relSnap = await getDocs(query(collection(db, "videos"), where("courseId", "==", v.courseId), where("subjectId", "==", v.subjectId)));
        setRelatedVideos(relSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Video)).filter((rv) => rv.id !== v.id));
      }
      setLoading(false);
    });
  }, [videoId]);

  if (loading) return <VideoPlayerSkeleton />;
  if (!video) return <p className="text-center py-12 text-muted-foreground">Video not found.</p>;

  const ytId = getYouTubeId(video.videoUrl);
  const allVideos = [video, ...relatedVideos];
  const currentIndex = allVideos.findIndex((v) => v.id === video.id);

  return (
    <div className="lg:flex lg:gap-4 lg:p-4">
      <div className="lg:flex-1">
        <div className="aspect-video bg-black">
          {ytId ? (
            <iframe src={`https://www.youtube.com/embed/${ytId}?rel=0`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <video src={video.videoUrl} controls className="w-full h-full" />
          )}
        </div>
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">{video.title}</h2>
          <div className="flex gap-2 flex-wrap">
            {currentIndex > 0 && (
              <Link to={`/video/${allVideos[currentIndex - 1].id}`} className="flex items-center gap-1 px-3 py-2 rounded-md bg-card border border-border text-sm">
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            )}
            {currentIndex < allVideos.length - 1 && (
              <Link to={`/video/${allVideos[currentIndex + 1].id}`} className="flex items-center gap-1 px-3 py-2 rounded-md bg-card border border-border text-sm">
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
            {video.pdfUrl && (
              <a href={video.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 rounded-md bg-card border border-border text-sm">
                <FileText className="h-4 w-4" /> PDF
              </a>
            )}
          </div>
        </div>

        {/* Mobile related videos */}
        <div className="lg:hidden p-4 space-y-2">
          <h3 className="font-semibold text-sm mb-2">More Videos</h3>
          {relatedVideos.map((rv) => (
            <Link key={rv.id} to={`/video/${rv.id}`} className="flex gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
              {rv.thumbnail && <img src={rv.thumbnail} alt={rv.title} className="w-28 h-16 rounded-md object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{rv.title}</p>
                <p className="text-xs text-muted-foreground">{settings.appName || "LMS"}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop related videos */}
      <div className="hidden lg:block lg:w-80 space-y-2">
        <h3 className="font-semibold text-sm mb-2">More Videos</h3>
        {relatedVideos.map((rv) => (
          <Link key={rv.id} to={`/video/${rv.id}`} className="flex gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
            {rv.thumbnail && <img src={rv.thumbnail} alt={rv.title} className="w-28 h-16 rounded-md object-cover shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{rv.title}</p>
              <p className="text-xs text-muted-foreground">{settings.appName || "LMS"}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
