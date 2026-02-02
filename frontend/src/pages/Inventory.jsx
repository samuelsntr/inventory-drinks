import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import InventoryForm from "@/components/InventoryForm";
import ItemDetailDialog from "@/components/ItemDetailDialog";
import PaginationControls from "@/components/PaginationControls";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { useDebounce } from "@/hooks/useDebounce";

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWarehouse, setCurrentWarehouse] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchItems();
  }, [currentWarehouse, debouncedSearch, page]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/inventory`, {
        params: {
          warehouse: currentWarehouse,
          search: debouncedSearch,
          page: page,
          limit: 10,
        },
      });
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleWarehouseChange = (val) => {
    setCurrentWarehouse(val);
    setPage(1); // Reset page when changing tab
  };

  const { DeleteDialog, confirmDelete } = useDeleteDialog(
    (id) => axios.delete(`/inventory/${id}`),
    {
      onSuccess: fetchItems,
      successMessage: "Item deleted",
      title: "Delete Item",
      description: "Are you sure you want to delete this item?",
    },
  );

  const canEdit = user?.role === "admin" || user?.role === "super admin";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search by code, name, category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on search
              }}
              className="w-full md:w-64"
            />
            {canEdit && (
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            )}
          </div>
        </div>

        <Tabs
          defaultValue="All"
          onValueChange={handleWarehouseChange}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="All">All Warehouses</TabsTrigger>
            <TabsTrigger value="JAAN">JAAN Warehouse</TabsTrigger>
            <TabsTrigger value="DW">DW Warehouse</TabsTrigger>
          </TabsList>

          <TabsContent value={currentWarehouse} className="mt-4">
            <div className="space-y-4">
              <InventoryTable
                items={items}
                loading={loading}
                canEdit={canEdit}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                onView={handleView}
              />

              {totalPages > 1 && (
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>

        {showForm && (
          <InventoryForm
            item={selectedItem}
            warehouse={currentWarehouse === "All" ? "JAAN" : currentWarehouse}
            onClose={() => setShowForm(false)}
            onSuccess={fetchItems}
          />
        )}

        {showDetail && (
          <ItemDetailDialog
            item={selectedItem}
            onClose={() => setShowDetail(false)}
          />
        )}

        <DeleteDialog />
      </div>
    </DashboardLayout>
  );
}

function InventoryTable({ items, loading, canEdit, onEdit, onDelete, onView }) {
  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-10 w-10 object-cover rounded border"
                  />
                ) : (
                  <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground border">
                    No Img
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{item.code}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <Badge variant="outline">{item.warehouse}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.quantity > 0 ? "default" : "destructive"}>
                  {item.quantity}
                </Badge>
              </TableCell>
              <TableCell>{parseInt(item.price).toLocaleString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    item.condition === "good" ? "secondary" : "destructive"
                  }
                  className={
                    item.condition === "good"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                      : ""
                  }
                >
                  {item.condition}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View Details"
                    onClick={() => onView(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={9}
                className="text-center h-24 text-muted-foreground"
              >
                No items found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
