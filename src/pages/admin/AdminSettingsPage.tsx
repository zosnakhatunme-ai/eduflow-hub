import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSettings } from "@/types";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { ImageUrlInput } from "@/components/ImageUrlInput";

const defaultSettings: AppSettings = {
  appName: "LMS", appLogo: "", youtubeChannel: "", googleDrive: "",
  paymentMethods: [], socialLinks: [], usefulLinks: [],
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "settings", "app")).then((snap) => {
      if (snap.exists()) setSettings({ ...defaultSettings, ...snap.data() } as AppSettings);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "app"), settings);
      localStorage.removeItem("fsc_settings_app");
      toast.success("Settings saved!");
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  if (loading) return <p className="p-4 text-muted-foreground">Loading...</p>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <div className="space-y-3">
        <input placeholder="App Name" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
        <ImageUrlInput label="App Logo" value={settings.appLogo} onChange={(url) => setSettings({ ...settings, appLogo: url })} />
        <input placeholder="YouTube Channel URL" value={settings.youtubeChannel} onChange={(e) => setSettings({ ...settings, youtubeChannel: e.target.value })} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
        <input placeholder="Google Drive URL" value={settings.googleDrive} onChange={(e) => setSettings({ ...settings, googleDrive: e.target.value })} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-sm" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Payment Methods</h3>
          <button onClick={() => setSettings({ ...settings, paymentMethods: [...settings.paymentMethods, { name: "", number: "" }] })} className="text-xs text-primary flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {settings.paymentMethods.map((pm, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input placeholder="Method" value={pm.name} onChange={(e) => { const arr = [...settings.paymentMethods]; arr[i].name = e.target.value; setSettings({ ...settings, paymentMethods: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input placeholder="Number" value={pm.number} onChange={(e) => { const arr = [...settings.paymentMethods]; arr[i].number = e.target.value; setSettings({ ...settings, paymentMethods: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <button onClick={() => setSettings({ ...settings, paymentMethods: settings.paymentMethods.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Social Links</h3>
          <button onClick={() => setSettings({ ...settings, socialLinks: [...settings.socialLinks, { name: "", link: "" }] })} className="text-xs text-primary flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {settings.socialLinks.map((sl, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input placeholder="Name" value={sl.name} onChange={(e) => { const arr = [...settings.socialLinks]; arr[i].name = e.target.value; setSettings({ ...settings, socialLinks: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input placeholder="Link" value={sl.link} onChange={(e) => { const arr = [...settings.socialLinks]; arr[i].link = e.target.value; setSettings({ ...settings, socialLinks: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <button onClick={() => setSettings({ ...settings, socialLinks: settings.socialLinks.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Useful Links</h3>
          <button onClick={() => setSettings({ ...settings, usefulLinks: [...settings.usefulLinks, { name: "", link: "" }] })} className="text-xs text-primary flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
        </div>
        {settings.usefulLinks.map((ul, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input placeholder="Name" value={ul.name} onChange={(e) => { const arr = [...settings.usefulLinks]; arr[i].name = e.target.value; setSettings({ ...settings, usefulLinks: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <input placeholder="Link" value={ul.link} onChange={(e) => { const arr = [...settings.usefulLinks]; arr[i].link = e.target.value; setSettings({ ...settings, usefulLinks: arr }); }} className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm" />
            <button onClick={() => setSettings({ ...settings, usefulLinks: settings.usefulLinks.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></button>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
