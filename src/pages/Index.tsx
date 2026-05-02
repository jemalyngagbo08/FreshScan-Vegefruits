import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Leaf, Loader2, Sparkles } from "lucide-react";
import logo from "@/assets/freshscan-logo.png";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CameraCapture } from "@/components/CameraCapture";
import { ResultCard } from "@/components/ResultCard";
import { HistoryPanel } from "@/components/HistoryPanel";
import {
  loadHistory,
  saveHistoryItem,
  updateFeedback,
  clearHistory,
  deleteHistoryItem,
  type AnalysisResult,
  type HistoryItem,
} from "@/lib/history";

const Index = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
    document.title = "FreshScan AI — Fruit & Vegetable Freshness Detector";
  }, []);

  const downscale = (dataUrl: string, max = 1024): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const analyze = async (rawDataUrl: string) => {
    const dataUrl = await downscale(rawDataUrl);
    setImageDataUrl(dataUrl);
    setResult(null);
    setActiveId(null);
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-produce", {
        body: { imageBase64: dataUrl },
      });
      if (error) {
        const ctx = (error as any).context;
        if (ctx?.status === 429) toast.error("Too many requests. Wait a moment and try again.");
        else if (ctx?.status === 402) toast.error("AI credits exhausted. Add credits to continue.");
        else toast.error(error.message || "Analysis failed");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const res = data as AnalysisResult;
      setResult(res);
      const id = crypto.randomUUID();
      setActiveId(id);
      const item: HistoryItem = { id, timestamp: Date.now(), thumbnail: dataUrl, result: res };
      saveHistoryItem(item);
      setHistory(loadHistory());
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const onCameraCapture = (dataUrl: string) => {
    setShowCamera(false);
    analyze(dataUrl);
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => analyze(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const reset = () => {
    setImageDataUrl(null);
    setResult(null);
    setActiveId(null);
  };

  const onFeedback = (kind: "correct" | "incorrect") => {
    if (!activeId) return;
    updateFeedback(activeId, kind);
    setHistory(loadHistory());
    toast.success(kind === "correct" ? "Thanks for confirming!" : "Thanks — feedback recorded.");
  };

  const onViewHistoryItem = (item: HistoryItem) => {
    setImageDataUrl(item.thumbnail);
    setResult(item.result);
    setActiveId(item.id);
  };

  const onDeleteHistoryItem = (id: string) => {
    deleteHistoryItem(id);
    setHistory(loadHistory());
    if (activeId === id) {
      reset();
    }
    toast.success("History item deleted");
  };

  const onClearHistory = () => {
    clearHistory();
    setHistory([]);
    toast.success("History cleared");
  };

  return (
    <div className="min-h-screen bg-background">
      {showCamera && <CameraCapture onCapture={onCameraCapture} onClose={() => setShowCamera(false)} />}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary-glow)/0.4),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-10 sm:pt-8 sm:pb-12 md:pt-12 md:pb-16 text-primary-foreground text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src={logo}
              alt="FreshScan AI logo"
              className="size-11 sm:size-12 rounded-2xl shadow-glow"
            />
            <p className="text-xl sm:text-2xl font-bold tracking-tight">FreshScan AI</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/15 backdrop-blur-sm text-xs font-medium border border-primary-foreground/20">
            <Sparkles className="size-3.5" /> AI Powered Freshness Check
          </div>
          <h1 className="mt-3 sm:mt-4 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mx-auto max-w-2xl">
            Is your produce <span className="italic">still good?</span>
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-primary-foreground/85 max-w-xl mx-auto">
            Snap a photo of any fruit or vegetable and instantly find out if it's fresh or rotten.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 pb-16 sm:pb-20">
        {/* Action card */}
        {!result && !analyzing && (
          <section className="rounded-3xl gradient-card border border-border shadow-card p-6 md:p-10 animate-float-in pl-[40px]">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-2xl gradient-hero shadow-glow flex items-center justify-center mb-4">
                <Leaf className="size-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Check your produce</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Use your camera or upload a photo. We'll identify it and tell you if it's still good to eat.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                <Button size="lg" className="flex-1 h-14 text-base shadow-glow" onClick={() => setShowCamera(true)}>
                  <Camera className="size-5" /> Open camera
                </Button>
                <Button size="lg" variant="outline" className="flex-1 h-14 text-base" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-5" /> Upload image
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Analyzing */}
        {analyzing && (
          <section className="rounded-3xl gradient-card border border-border shadow-card p-6 md:p-8 animate-float-in">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                {imageDataUrl && <img src={imageDataUrl} alt="Analyzing" className="absolute inset-0 w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="size-16 rounded-full bg-card/90 flex items-center justify-center shadow-glow animate-pulse-ring">
                    <Loader2 className="size-7 text-primary animate-spin" />
                  </div>
                </div>
                <div className="absolute left-0 right-0 h-1 bg-primary-glow shadow-glow animate-scan" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Working...</p>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Analyzing your image</h2>
                <p className="text-muted-foreground">Identifying the produce and inspecting it for signs of spoilage.</p>
              </div>
            </div>
          </section>
        )}

        {/* Result */}
        {result && imageDataUrl && (
          <ResultCard
            result={result}
            imageDataUrl={imageDataUrl}
            onReset={reset}
            onFeedback={onFeedback}
            feedback={history.find((h) => h.id === activeId)?.feedback}
          />
        )}

        {/* History */}
        <section className="mt-12">
          <HistoryPanel
            items={history}
            onClear={onClearHistory}
            onView={onViewHistoryItem}
            onDelete={onDeleteHistoryItem}
          />
        </section>

        {/* Tips */}
        <section className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { title: "Good lighting", body: "Natural daylight gives the most accurate freshness reading." },
            { title: "Fill the frame", body: "Get close so the produce takes up most of the image." },
            { title: "Plain background", body: "Avoid clutter so the AI focuses on the right item." },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl bg-secondary/50 border border-border p-4">
              <h3 className="font-semibold text-secondary-foreground">{t.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground px-4 font-sans font-semibold">
        Developed By: Jemalyn_Jonbert_Rose-Ann_Nesly_Angeline@2026
      </footer>
    </div>
  );
};

export default Index;
