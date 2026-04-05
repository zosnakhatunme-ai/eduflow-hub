import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/types";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";
  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";

  const [tab, setTab] = useState<"login" | "register" | "reset">(initialTab);
  const { user, login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const settings = useAppSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (user) navigate("/classroom", { replace: true });
  }, [user]);

  useEffect(() => {
    getDocs(collection(db, "courses")).then((snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course)));
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/classroom", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { toast.error("Please select a course"); return; }
    setLoading(true);
    try {
      const uid = await register(email, password, name);
      await addDoc(collection(db, "enrollRequests"), {
        userId: uid,
        courseId,
        userName: name,
        userEmail: email,
        status: "pending",
        paymentInfo: { method: paymentMethod, paymentNumber, transactionId, screenshot: "" },
        createdAt: Timestamp.now(),
      });
      toast.success("Registration successful! Waiting for approval.");
      navigate("/classroom", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent!");
      setTab("login");
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-center mb-6">{settings.appName || "LMS"}</h2>

      <div className="flex border-b border-border mb-6">
        <button onClick={() => setTab("login")} className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "login" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Login</button>
        <button onClick={() => setTab("register")} className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "register" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Register</button>
      </div>

      {tab === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {loading ? "Loading..." : "Login"}
          </button>
          <button type="button" onClick={() => setTab("reset")} className="w-full text-xs text-muted-foreground hover:text-primary">Forgot password?</button>
        </form>
      )}

      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm">
            <option value="">Select Course</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.courseName} - ৳{c.price}</option>)}
          </select>
          {settings.paymentMethods?.length > 0 && (
            <>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm">
                <option value="">Payment Method</option>
                {settings.paymentMethods.map((pm, i) => <option key={i} value={pm.name}>{pm.name} - {pm.number}</option>)}
              </select>
              <input type="text" placeholder="Payment Number" value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
              <input type="text" placeholder="Transaction ID" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
            </>
          )}
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {loading ? "Loading..." : "Register & Enroll"}
          </button>
        </form>
      )}

      {tab === "reset" && (
        <form onSubmit={handleReset} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground text-sm" />
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {loading ? "Loading..." : "Send Reset Link"}
          </button>
          <button type="button" onClick={() => setTab("login")} className="w-full text-xs text-muted-foreground hover:text-primary">Back to Login</button>
        </form>
      )}
    </div>
  );
}
