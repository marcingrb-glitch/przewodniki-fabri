import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Search, CalendarIcon, FileSpreadsheet, Eye, RotateCw, Trash2,
  PackageOpen, Plus, Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getOrders, deleteOrder } from "@/utils/supabaseQueries";
import { parseSKU } from "@/utils/skuParser";
import { decodeSKU } from "@/utils/skuDecoder";
import { generateSofaGuidePDF } from "@/utils/pdfGenerators/sofaGuide";
import { generatePufaGuidePDF } from "@/utils/pdfGenerators/pufaGuide";
import { generateFotelGuidePDF } from "@/utils/pdfGenerators/fotelGuide";
import { generateSofaLabelsPDF, generatePufaLabelsPDF, generateFotelLabelsPDF } from "@/utils/pdfGenerators/labels";
import { generateDecodingPDF } from "@/utils/pdfGenerators/decodingPDF";
import { uploadPDF, saveOrderFile } from "@/utils/storage";
import { useDebounce } from "@/hooks/useDebounce";
import { DecodedSKU } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

const LIMIT = 20;

const OrderHistoryPage = () => {
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [seriesFilter, setSeriesFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Action states
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reset page on filter change
  const resetPage = () => setPage(1);

  // Fetch series for filter
  const { data: seriesList = [] } = useQuery({
    queryKey: ["series-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("series").select("code, name").order("code");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch orders
  const { data: ordersResult, isLoading, refetch } = useQuery({
    queryKey: ["orders-history", debouncedSearch, dateRange?.from, dateRange?.to, seriesFilter, page],
    queryFn: () =>
      getOrders({
        searchQuery: debouncedSearch,
        dateFrom: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
        dateTo: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
        seriesCode: seriesFilter,
        page,
        limit: LIMIT,
      }),
  });

  const orders = ordersResult?.data || [];
  const totalCount = ordersResult?.count || 0;
  const totalPages = Math.ceil(totalCount / LIMIT);

  // Regenerate PDFs
  const handleRegenerate = async (order: any) => {
    setRegeneratingId(order.id);
    try {
      const parsed = parseSKU(order.sku);
      const decoded = decodeSKU(parsed);
      decoded.orderNumber = order.order_number;
      decoded.orderDate = format(new Date(order.order_date), "dd.MM.yyyy");
      decoded.rawSKU = order.sku;

      const orderId = order.id;
      const orderNumber = order.order_number;

      const uploadAndSave = async (blob: Blob, fileName: string, fileType: string) => {
        const url = await uploadPDF(orderNumber, fileName, blob);
        await saveOrderFile(orderId, fileType, url, fileName);
      };

      // Batch generate & upload
      const uploads: Promise<void>[] = [];

      // Sofa (always)
      uploads.push(generateSofaGuidePDF(decoded).then((b) => uploadAndSave(b, `sofa_przewodnik_${orderNumber}.pdf`, "sofa_guide")));
      uploads.push(generateSofaLabelsPDF(decoded).then((b) => uploadAndSave(b, `sofa_etykiety_${orderNumber}.pdf`, "sofa_labels")));

      // Pufa
      if (decoded.pufaSKU) {
        uploads.push(generatePufaGuidePDF(decoded).then((b) => uploadAndSave(b, `pufa_przewodnik_${orderNumber}.pdf`, "pufa_guide")));
        uploads.push(generatePufaLabelsPDF(decoded).then((b) => uploadAndSave(b, `pufa_etykiety_${orderNumber}.pdf`, "pufa_labels")));
      }

      // Fotel
      if (decoded.fotelSKU) {
        uploads.push(generateFotelGuidePDF(decoded).then((b) => uploadAndSave(b, `fotel_przewodnik_${orderNumber}.pdf`, "fotel_guide")));
        uploads.push(generateFotelLabelsPDF(decoded).then((b) => uploadAndSave(b, `fotel_etykiety_${orderNumber}.pdf`, "fotel_labels")));
      }

      // Decoding
      uploads.push(generateDecodingPDF(decoded).then((b) => uploadAndSave(b, `dekodowanie_${orderNumber}.pdf`, "decoding")));

      await Promise.all(uploads);

      // Update decoded_data in DB
      await supabase.from("orders").update({ decoded_data: JSON.parse(JSON.stringify(decoded)) }).eq("id", orderId);

      toast.success("✅ Wszystkie pliki zostały zregenerowane");
      refetch();
    } catch (err: unknown) {
      toast.error(`❌ Błąd regeneracji: ${err instanceof Error ? err.message : "Nieznany błąd"}`);
    } finally {
      setRegeneratingId(null);
    }
  };

  // Delete order
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrder(deleteTarget.id, deleteTarget.orderNumber);
      toast.success("✅ Zamówienie zostało usunięte");
      refetch();
    } catch (err: unknown) {
      toast.error(`❌ Błąd usuwania: ${err instanceof Error ? err.message : "Nieznany błąd"}`);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    if (!orders.length) return;
    const headers = ["Numer zamówienia", "Data", "SKU", "Seria"];
    const rows = orders.map((o: any) => [
      o.order_number,
      format(new Date(o.order_date), "dd.MM.yyyy"),
      `"${o.sku}"`,
      o.series_code || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `zamowienia_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("✅ CSV wyeksportowany");
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-2xl">📋 Historia Zamówień</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!orders.length}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Eksportuj CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-search-input
                placeholder="Szukaj po numerze zamówienia... (Ctrl+K)"
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("min-w-[200px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to
                      ? `${format(dateRange.from, "dd.MM.yyyy")} - ${format(dateRange.to, "dd.MM.yyyy")}`
                      : format(dateRange.from, "dd.MM.yyyy")
                  ) : "Zakres dat"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => { setDateRange(range); resetPage(); }}
                  numberOfMonths={2}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                {dateRange && (
                  <div className="border-t p-2">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateRange(undefined); resetPage(); }}>
                      Wyczyść daty
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Select value={seriesFilter} onValueChange={(v) => { setSeriesFilter(v); resetPage(); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Wszystkie serie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie serie</SelectItem>
                {seriesList.map((s: any) => (
                  <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && orders.length === 0 && (
            <div className="text-center py-12">
              <PackageOpen className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Brak zamówień</h3>
              <p className="text-muted-foreground mb-4">
                {debouncedSearch || dateRange || seriesFilter !== "all"
                  ? "Brak wyników dla podanych filtrów"
                  : "Dodaj pierwsze zamówienie aby zobaczyć je tutaj"}
              </p>
              <Button onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-2" />
                Nowe zamówienie
              </Button>
            </div>
          )}

          {/* Table */}
          {!isLoading && orders.length > 0 && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numer zamówienia</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Seria</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order: any) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        <TableCell className="font-bold">{order.order_number}</TableCell>
                        <TableCell>{format(new Date(order.order_date), "dd.MM.yyyy")}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-xs">
                                  {order.sku.length > 35 ? `${order.sku.substring(0, 35)}…` : order.sku}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-sm">
                                <p className="font-mono text-xs break-all">{order.sku}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {order.series_code && <Badge variant="outline">{order.series_code}</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/order/${order.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={regeneratingId === order.id}
                              onClick={() => handleRegenerate(order)}
                            >
                              {regeneratingId === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget({ id: order.id, orderNumber: order.order_number })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col items-center gap-2 mt-4 sm:flex-row sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Strona {page} z {totalPages} | Razem: {totalCount} zamówień
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((num) => (
                        <PaginationItem key={num}>
                          <PaginationLink
                            onClick={() => setPage(num)}
                            isActive={page === num}
                            className="cursor-pointer"
                          >
                            {num}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń zamówienie</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno usunąć zamówienie <strong>{deleteTarget?.orderNumber}</strong>? Wszystkie powiązane pliki również zostaną usunięte. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrderHistoryPage;
