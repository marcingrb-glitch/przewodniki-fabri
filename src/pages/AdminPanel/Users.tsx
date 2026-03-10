import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/utils/errorHandler";
import { Check, X, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface UserPerm {
  user_id: string;
  can_view_cheatsheets: boolean;
  can_view_specs: boolean;
}

export default function Users() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");

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

  const { data: permissions = [] } = useQuery({
    queryKey: ["admin-user-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("user_id, can_view_cheatsheets, can_view_specs");
      if (error) throw error;
      return data as UserPerm[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (error) throw error;
      return data as { user_id: string; role: string }[];
    },
  });

  const permMap = new Map(permissions.map(p => [p.user_id, p]));
  const adminIds = new Set(roles.filter(r => r.role === "admin").map(r => r.user_id));

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

  const updatePermission = useMutation({
    mutationFn: async ({ userId, field, value }: { userId: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from("user_permissions")
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-permissions"] });
      toast.success("✅ Uprawnienia zaktualizowane");
    },
    onError: (err) => {
      toast.error(`❌ ${getUserFriendlyError(err)}`);
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email: newEmail, password: newPassword, full_name: newName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("✅ Użytkownik utworzony i zaakceptowany");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-permissions"] });
      setAddOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">👥 Zarządzanie użytkownikami</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Akceptuj nowych użytkowników i zarządzaj dostępem
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Dodaj użytkownika
        </Button>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            ⏳ Oczekujący na akceptację
            <Badge variant="destructive">{pending.length}</Badge>
          </h2>
          <UserTable
            users={pending}
            permMap={permMap}
            onToggle={(id, approved) => toggleApproval.mutate({ id, approved })}
            onPermChange={(userId, field, value) => updatePermission.mutate({ userId, field, value })}
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
            permMap={permMap}
            onToggle={(id, approved) => toggleApproval.mutate({ id, approved })}
            onPermChange={(userId, field, value) => updatePermission.mutate({ userId, field, value })}
            isPending={toggleApproval.isPending}
          />
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Imię i nazwisko</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jan Kowalski"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="jan@firma.pl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Hasło</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 znaków"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Anuluj
            </Button>
            <Button
              onClick={() => createUser.mutate()}
              disabled={!newEmail || !newPassword || createUser.isPending}
            >
              {createUser.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Utwórz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTable({
  users,
  permMap,
  onToggle,
  onPermChange,
  isPending,
}: {
  users: UserProfile[];
  permMap: Map<string, UserPerm>;
  onToggle: (id: string, approved: boolean) => void;
  onPermChange: (userId: string, field: string, value: boolean) => void;
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
            <TableHead className="text-center">Ściągawki</TableHead>
            <TableHead className="text-center">Specyfikacje</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Akcja</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const perm = permMap.get(user.id);
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.full_name || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("pl-PL")
                    : "—"}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm?.can_view_cheatsheets ?? false}
                    onCheckedChange={(checked) =>
                      onPermChange(user.id, "can_view_cheatsheets", !!checked)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={perm?.can_view_specs ?? false}
                    onCheckedChange={(checked) =>
                      onPermChange(user.id, "can_view_specs", !!checked)
                    }
                  />
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
