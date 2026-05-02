import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Aperture } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

export const CameraCapture = ({ onCapture, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        console.error(e);
        toast.error("Could not access camera. Check browser permissions.");
        onClose();
      }
    };
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode, onClose]);

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight, 1024);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 animate-float-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 size-11 rounded-full bg-card border border-border shadow-card flex items-center justify-center transition-smooth hover:scale-105 z-10"
        aria-label="Close camera"
      >
        <X className="size-5" />
      </button>

      <div className="relative w-full max-w-[min(92vw,32rem)] aspect-square rounded-3xl overflow-hidden shadow-glow border-4 border-primary/20">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        {ready && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-6 border-2 border-primary-foreground/40 rounded-2xl" />
            <div className="absolute left-6 right-6 h-0.5 bg-primary-glow shadow-glow animate-scan" />
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground text-center max-w-xs">
        Center the fruit or vegetable in good lighting for best results.
      </p>

      <div className="mt-8 flex items-center gap-6">
        <Button
          variant="outline"
          size="icon"
          className="size-14 rounded-full"
          onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
        >
          <RefreshCw className="size-5" />
        </Button>
        <button
          onClick={snap}
          disabled={!ready}
          className="size-20 rounded-full gradient-hero shadow-glow flex items-center justify-center transition-smooth hover:scale-105 active:scale-95 disabled:opacity-50 animate-pulse-ring"
          aria-label="Capture"
        >
          <Aperture className="size-9 text-primary-foreground" />
        </button>
        <div className="size-14" />
      </div>
    </div>
  );
};
