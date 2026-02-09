import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  created_at: string | null;
}

export default function Users() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_approved, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approved }) => {
      toast.success(approved ? "✅ Użytkownik zaakceptowany" : "❌ Dostęp cofnięty");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    },
  });

  const pending = users.filter((u) => !u.is_approved);
  const approved = users.filter((u) => u.is_approved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">👥 Zarządzanie użytkownikami</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Akceptuj nowych użytkowników i zarządzaj dostępem
        </p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            ⏳ Oczekujący na akceptację
            <Badge variant="destructive">{pending.length}</Badge>
          </h2>
          <UserTable
            users={pending}
            onToggle={(id, approved) => toggleApproval.mutate({ id, approved })}
            isPending={toggleApproval.isPending}
          />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">✅ Zaakceptowani użytkownicy</h2>
        {approved.length === 0 ? (
          <p className="text-muted-foreground text-sm">Brak zaakceptowanych użytkowników.</p>
        ) : (
          <UserTable
            users={approved}
            onToggle={(id, approved) => toggleApproval.mutate({ id, approved })}
            isPending={toggleApproval.isPending}
          />
        )}
      </div>
    </div>
  );
}

function UserTable({
  users,
  onToggle,
  isPending,
}: {
  users: UserProfile[];
  onToggle: (id: string, approved: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Imię i nazwisko</TableHead>
            <TableHead>Data rejestracji</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcja</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.email}</TableCell>
              <TableCell>{user.full_name || "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString("pl-PL")
                  : "—"}
              </TableCell>
              <TableCell>
                {user.is_approved ? (
                  <Badge variant="default">Aktywny</Badge>
                ) : (
                  <Badge variant="secondary">Oczekuje</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {user.is_approved ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => onToggle(user.id, false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cofnij
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => onToggle(user.id, true)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Akceptuj
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
