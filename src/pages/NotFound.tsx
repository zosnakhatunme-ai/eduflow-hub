import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Page not found</p>
      <Link to="/" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">Go Home</Link>
    </div>
  );
}
