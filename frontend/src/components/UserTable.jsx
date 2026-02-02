import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import UserForm from "./UserForm";
import PaginationControls from "./PaginationControls";
import { useDeleteDialog } from "../hooks/useDeleteDialog";

const PER_PAGE = 10;

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = async () => {
    const res = await api.get("/users");
    setUsers(res.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let data = users;
    if (debouncedSearch) {
      data = data.filter((u) =>
        u.username.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    setFiltered(data);
    setPage(1);
  }, [debouncedSearch, users]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const { DeleteDialog, confirmDelete } = useDeleteDialog(
    (id) => api.delete(`/users/${id}`),
    {
      onSuccess: fetchUsers,
      successMessage: "User deleted",
      title: "Delete User",
      description: "Are you sure you want to delete this User?",
    }
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-start gap-4 mb-4 items-center">
        <Input
          placeholder="Cari username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-100"
        />
        <Button
          onClick={() => {
            setSelectedUser(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowForm(false);
            fetchUsers();
          }}
        />
      )}

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell className="text-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(u);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      confirmDelete(u.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* Delete Confirm Dialog */}
      <DeleteDialog />
    </div>
  );
}
