import { ReactNode } from "react";

interface Props {
  headers: { label: string; className?: string }[];
  children: ReactNode;
  size?: "sm" | "xs";
}

export function CheatsheetTable({ headers, children, size = "sm" }: Props) {
  const textClass = size === "xs" ? "text-xs" : "text-sm";
  return (
    <table className={`w-full ${textClass} border-collapse`}>
      <thead>
        <tr className="bg-muted">
          {headers.map((h, i) => (
            <th key={i} className={`border border-border px-${size === "xs" ? "1" : "2"} py-${size === "xs" ? "0.5" : "1"} text-left ${h.className ?? ""}`}>
              {h.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
