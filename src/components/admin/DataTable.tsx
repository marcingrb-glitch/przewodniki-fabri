import { useState, useMemo, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Edit, Trash2, Plus, ArrowUp, ArrowDown, Copy, X } from "lucide-react";

export interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onDuplicate?: (item: any) => void;
  isLoading: boolean;
}

const PAGE_SIZE = 20;

export default function DataTable({ title, columns, data, onAdd, onEdit, onDelete, onBulkDelete, onDuplicate, isLoading }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Reset selection when data changes (after bulk ops, view change, etc.)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

  const filtered = useMemo(() => {
    let items = data;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((item) =>
        columns.some((col) => {
          const v = item[col.key];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const va = a[sortKey] ?? "";
        const vb = b[sortKey] ?? "";
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortAsc ? cmp : -cmp;
      });
    }
    return items;
  }, [data, search, sortKey, sortAsc, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const pagedIds = paged.map((item) => item.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));
  const somePageSelected = pagedIds.some((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (allPageSelected) {
      const next = new Set(selectedIds);
      pagedIds.forEach((id) => next.delete(id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      pagedIds.forEach((id) => next.add(id));
      setSelectedIds(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedIds));
    }
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Button onClick={onAdd}><Plus className="mr-1 h-4 w-4" /> Dodaj nowy</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Szukaj..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Zaznacz wszystko"
                  {...(somePageSelected && !allPageSelected ? { "data-state": "indeterminate" } : {})}
                />
              </TableHead>
              {columns.map((col) => (
                <TableHead key={col.key} className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-[130px]">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  {columns.map((col) => <TableCell key={col.key}><Skeleton className="h-5 w-full" /></TableCell>)}
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                </TableRow>
              ))
            ) : paged.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 2} className="text-center text-muted-foreground py-8">Brak danych</TableCell></TableRow>
            ) : (
              paged.map((item) => (
                <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-amber-50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleOne(item.id)}
                      aria-label="Zaznacz rekord"
                    />
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item[col.key], item) : (
                        typeof item[col.key] === "object" ? JSON.stringify(item[col.key]) : String(item[col.key] ?? "")
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      {onDuplicate && (
                        <Button variant="ghost" size="icon" onClick={() => onDuplicate(item)} title="Duplikuj">
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Edytuj"><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Usuń"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Czy na pewno usunąć?</AlertDialogTitle>
                            <AlertDialogDescription>Ta operacja jest nieodwracalna.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(item.id)}>Usuń</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Strona {page + 1} z {totalPages} ({filtered.length} wyników)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Poprzednia</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Następna</Button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">Zaznaczono: {selectedIds.size}</span>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            <X className="mr-1 h-3 w-3" /> Odznacz wszystko
          </Button>
          {onBulkDelete && (
            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1 h-3 w-3" /> Usuń zaznaczone
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz usunąć {selectedIds.size} zaznaczonych rekordów?</AlertDialogTitle>
                  <AlertDialogDescription>Tej operacji nie można cofnąć.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Usuń</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}
