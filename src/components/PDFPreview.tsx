import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  if (!pdfBlob) return null;

  return (
    <Dialog open={!!pdfBlob} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <iframe
            src={blobUrl}
            className="w-full h-full rounded border"
            title={title}
          />
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
