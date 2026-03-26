import { useRef, useEffect, useState } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  series: "Seria",
  fabric: "Tkanina",
  seat: "Siedzisko",
  side: "Boczek",
  backrest: "Oparcie",
  chest: "Skrzynia",
  automat: "Automat",
  leg: "Nóżka",
  pillow: "Poduszka",
  jasiek: "Jasiek",
  walek: "Wałek",
  extra: "Extra",
  width: "Szerokość",
  orientation: "Orientacja",
};

export { SEGMENT_LABELS };

export const EXAMPLE_SKUS: Record<string, string> = {
  sofa: "S1-T3D-SD2NA-B8C-OP62A-SK15-AT1-N5A-P1-J1-W1-PF",
  narożnik: "N2-130P-T13C-SD4B-B5B-OP68A-SK23-AT1-P1B",
};

export function SkuVisualizer({
  sku,
  segments,
}: {
  sku: string;
  segments: any[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const parts = sku.split("-");

  const matched = parts.map((part) => {
    for (const seg of segments) {
      try {
        if (new RegExp(seg.regex_pattern).test(part)) {
          return { part, segment: seg };
        }
      } catch {
        /* skip invalid regex */
      }
    }
    return { part, segment: null };
  });

  useEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const observer = new ResizeObserver(() => {
      const containerW = container.offsetWidth;
      const innerW = inner.scrollWidth;
      if (innerW > containerW && containerW > 0) {
        setScale(containerW / innerW);
      } else {
        setScale(1);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [matched.length]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden max-w-full">
      <div
        ref={innerRef}
        className="inline-flex items-start gap-1"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          marginBottom: scale < 1 ? `${-(1 - scale) * (innerRef.current?.offsetHeight ?? 60)}px` : undefined,
        }}
      >
        {matched.map((m, i) => (
          <div key={i} className="flex items-center">
            {i > 0 && (
              <span className="text-muted-foreground font-mono text-lg mx-0.5 self-start mt-1">-</span>
            )}
            <div className="flex flex-col items-center">
              <span
                className={`font-mono text-base font-bold px-2 py-1 rounded ${
                  m.segment
                    ? m.segment.is_optional
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {m.part}
              </span>
              <span
                className={`text-[11px] mt-1.5 whitespace-nowrap ${
                  m.segment?.is_optional
                    ? "text-muted-foreground italic"
                    : "text-muted-foreground font-medium"
                }`}
              >
                {m.segment
                  ? SEGMENT_LABELS[m.segment.segment_name] ?? m.segment.segment_name
                  : "?"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
