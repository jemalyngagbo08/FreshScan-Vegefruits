import { Button } from "@/components/ui/button";
import { Sparkles, AlertTriangle, ThumbsUp, ThumbsDown, RotateCcw, Leaf, Apple } from "lucide-react";
import type { AnalysisResult } from "@/lib/history";
import { cn } from "@/lib/utils";

type Props = {
  result: AnalysisResult;
  imageDataUrl: string;
  onReset: () => void;
  onFeedback: (kind: "correct" | "incorrect") => void;
  feedback?: "correct" | "incorrect";
};

export const ResultCard = ({ result, imageDataUrl, onReset, onFeedback, feedback }: Props) => {
  if (!result.detected) {
    return (
      <div className="rounded-3xl gradient-card border border-border shadow-card p-6 md:p-8 animate-float-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-16 rounded-full bg-accent/15 flex items-center justify-center">
            <AlertTriangle className="size-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">No produce detected</h2>
          <p className="text-muted-foreground max-w-sm">
            {result.tip || "We couldn't find a fruit or vegetable in this image. Try again with better lighting and a clearer view."}
          </p>
          <Button onClick={onReset} variant="default" size="lg" className="mt-2">
            <RotateCcw className="size-4" /> Try again
          </Button>
        </div>
      </div>
    );
  }

  const isFresh = result.freshness === "fresh";
  const Icon = result.category === "fruit" ? Apple : Leaf;

  return (
    <div className="rounded-3xl gradient-card border border-border shadow-card overflow-hidden animate-float-in">
      <div className="grid md:grid-cols-2 gap-0">
        <div className="relative aspect-square md:aspect-auto md:min-h-[320px] bg-muted">
          <img src={imageDataUrl} alt={result.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className={cn(
            "absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-soft",
            isFresh ? "gradient-fresh text-fresh-foreground" : "gradient-rotten text-rotten-foreground"
          )}>
            {isFresh ? "✓ Fresh" : "⚠ Rotten"}
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
            <Icon className="size-3.5" />
            {result.category}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-1">{result.name}</h2>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-sm font-medium text-muted-foreground">Confidence</span>
                <span className="text-2xl font-bold tabular-nums">{Math.round(result.confidence)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-smooth", isFresh ? "gradient-fresh" : "gradient-rotten")}
                  style={{ width: `${Math.max(5, Math.min(100, result.confidence))}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-secondary/60 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-secondary-foreground">{result.reason}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2.5">Was this correct?</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={feedback === "correct" ? "default" : "outline"}
                size="sm"
                onClick={() => onFeedback("correct")}
                className="flex-1 min-w-[110px]"
              >
                <ThumbsUp className="size-4" /> Correct
              </Button>
              <Button
                variant={feedback === "incorrect" ? "default" : "outline"}
                size="sm"
                onClick={() => onFeedback("incorrect")}
                className="flex-1 min-w-[110px]"
              >
                <ThumbsDown className="size-4" /> Incorrect
              </Button>
              <Button variant="secondary" size="sm" onClick={onReset} className="flex-1 min-w-[90px]">
                <RotateCcw className="size-4" /> New
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
