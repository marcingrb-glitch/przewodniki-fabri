import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { downloadBlob } from "@/utils/pdfHelpers";

interface PDFPreviewProps {
  pdfBlob: Blob | null;
  title: string;
  fileName: string;
  onClose: () => void;
}

const PDFPreview = ({ pdfBlob, title, fileName, onClose }: PDFPreviewProps) => {
  const dataUrl = useMemo(() => {
    if (!pdfBlob) return "";
    // Read blob as data URL synchronously isn't possible, 
    // so we use createObjectURL which is synchronous
    return URL.createObjectURL(pdfBlob);
  }, [pdfBlob]);

  if (!pdfBlob || !dataUrl) return null;

  return (
    <Dialog open onOpenChange={(open) => {
      if (!open) {
        URL.revokeObjectURL(dataUrl);
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Podgląd wygenerowanego dokumentu PDF</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <object
            data={dataUrl}
            type="application/pdf"
            className="w-full h-full rounded border"
          >
            <p className="p-4 text-center text-muted-foreground">
              Twoja przeglądarka nie obsługuje podglądu PDF.{" "}
              <button className="underline text-primary" onClick={() => downloadBlob(pdfBlob, fileName)}>
                Pobierz plik
              </button>
            </p>
          </object>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => {
            URL.revokeObjectURL(dataUrl);
            onClose();
          }}>
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
