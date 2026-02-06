import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axios from "@/lib/axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
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

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("DESC");

  useEffect(() => {
    fetchItems();
  }, [currentWarehouse, debouncedSearch, page, sortBy, sortOrder]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/inventory`, {
        params: {
          warehouse: currentWarehouse,
          search: debouncedSearch,
          page: page,
          limit: 10,
          sortBy,
          sortOrder,
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
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
            <TabsTrigger value="DW">DW Warehouse</TabsTrigger>
            <TabsTrigger value="JAAN">JAAN Warehouse</TabsTrigger>
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
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
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

function InventoryTable({
  items,
  loading,
  canEdit,
  onEdit,
  onDelete,
  onView,
  sortBy,
  sortOrder,
  onSort,
}) {
  if (loading) return <div>Loading...</div>;

  const SortIcon = ({ field }) => {
    if (sortBy !== field)
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === "ASC" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

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
            <TableHead
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSort("quantity")}
            >
              <div className="flex items-center">
                Quantity
                <SortIcon field="quantity" />
              </div>
            </TableHead>
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
                <Badge
                  variant="outline"
                  className={
                    item.warehouse === "JAAN"
                      ? "text-yellow-600 border-yellow-600"
                      : item.warehouse === "DW"
                        ? "text-blue-600 border-blue-600"
                        : ""
                  }
                >
                  {item.warehouse}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.quantity > 5 ? "default" : "destructive"}>
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
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    title="View Details"
                    onClick={() => onView(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Edit"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
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
