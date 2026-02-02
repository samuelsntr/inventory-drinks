import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function UserForm({ user, onClose }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "staff",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        role: user.role || "staff",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username || !form.role) {
      toast.error("Username dan role wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      if (!user) {
        if (!form.password || !form.confirmPassword) {
          toast.error("Password dan konfirmasi wajib diisi.");
          return;
        }

        if (form.password !== form.confirmPassword) {
          toast.error("Password dan konfirmasi tidak cocok.");
          return;
        }

        await api.post("/users", {
          username: form.username,
          role: form.role,
          password: form.password,
        });

        toast.success("User berhasil ditambahkan.");
      } else {
        const payload = {
          username: form.username,
          role: form.role,
        };

        if (form.password) {
          if (form.password !== form.confirmPassword) {
            toast.error("Password dan konfirmasi tidak cocok.");
            return;
          }

          payload.password = form.password;
        }

        await api.put(`/users/${user.id}`, payload);
        toast.success("User berhasil diupdate.");
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan data user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Tambah User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label>Password {user && "(Opsional)"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={user ? "Kosongkan jika tidak ingin diubah" : ""}
              required={!user}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label>Konfirmasi Password</Label>
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required={!user}
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => setForm({ ...form, role: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : user ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
