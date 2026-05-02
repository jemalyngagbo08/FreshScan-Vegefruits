import { Button } from "@/components/ui/button";
import { Trash2, Clock, Eye } from "lucide-react";
import type { HistoryItem } from "@/lib/history";
import { cn } from "@/lib/utils";

type Props = {
  items: HistoryItem[];
  onClear: () => void;
  onView: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
};

export const HistoryPanel = ({ items, onClear }: Props) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        <Clock className="size-8 mx-auto mb-3 opacity-40" />
        Your recent checks will appear here.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent checks</h3>
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground h-8">
          <Trash2 className="size-3.5" /> Clear
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((item) => {
          const fresh = item.result.freshness === "fresh";
          return (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-border shadow-soft transition-smooth hover:shadow-card">
              <div className="absolute inset-0 z-10 flex items-start justify-end p-2 opacity-0 transition opacity-0 group-hover:opacity-100">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onView(item)}
                    title="View history item"
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item.id)}
                    title="Delete history item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="aspect-square bg-muted">
                <img src={item.thumbnail} alt={item.result.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-foreground/85 to-transparent text-background">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold truncate">{item.result.name || "Unknown"}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                    item.result.detected ? (fresh ? "bg-fresh text-fresh-foreground" : "bg-rotten text-rotten-foreground") : "bg-muted text-muted-foreground"
                  )}>
                    {item.result.detected ? (fresh ? "Fresh" : "Rotten") : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
