import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
  value: string | number | null | undefined;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "number";
  placeholder?: string;
  className?: string;
}

export default function InlineEditCell({ value, onSave, type = "text", placeholder = "uzupełnij", className }: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setEditValue(value != null ? String(value) : "");
    setEditing(true);
  };

  const save = async () => {
    setEditing(false);
    const newVal = editValue.trim();
    if (newVal !== (value != null ? String(value) : "")) {
      await onSave(newVal);
    }
  };

  const cancel = () => {
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className={cn("h-8 text-sm", className)}
      />
    );
  }

  const isEmpty = value == null || String(value).trim() === "";

  return (
    <span
      onClick={startEdit}
      className={cn(
        "cursor-pointer rounded px-2 py-1 min-w-[60px] inline-block",
        isEmpty ? "bg-muted text-muted-foreground italic" : "hover:bg-accent",
        className
      )}
    >
      {isEmpty ? placeholder : String(value)}
    </span>
  );
}
