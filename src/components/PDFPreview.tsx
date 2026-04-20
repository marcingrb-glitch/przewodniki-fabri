import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadBlob } from "@/utils/pdfHelpers";

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  title: string;
  fileName: string;
  onClose: () => void;
}

const PDFPreview = ({ pdfBlob, title, fileName, onClose }: PDFPreviewProps) => {
  // Blob: URL — szybsze i obsługiwane przez iframe PDF viewer
  // (data: URI bywa blokowane przez Chrome w iframe).
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (!pdfBlob) {
      setBlobUrl("");
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfBlob]);

  if (!pdfBlob) return null;

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Podgląd wygenerowanego dokumentu PDF</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          {blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=1&view=FitH`}
              title={title}
              className="w-full h-full rounded border"
              style={{ minHeight: 0 }}
            />
          ) : (
            <Skeleton className="w-full h-full rounded" />
          )}
        </div>
        <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>Nie widać podglądu? Otwórz w nowej karcie:</span>
          <a href={blobUrl} target="_blank" rel="noopener" className="underline">
            open pdf ↗
          </a>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1.5 h-4 w-4" /> Zamknij
          </Button>
          <Button onClick={() => downloadBlob(pdfBlob, fileName)}>
            <Download className="mr-1.5 h-4 w-4" /> Pobierz PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview;
