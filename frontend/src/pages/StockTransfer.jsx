import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import DashboardLayout from "@/components/layout/DashboardLayout";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRightLeft, Search } from "lucide-react";
import PaginationControls from "@/components/PaginationControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";

export default function StockTransfer() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchTransfers();
  }, [debouncedSearch, page]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/transfer/history", {
        params: {
          search: debouncedSearch,
          page: page,
          limit: 10,
        },
      });
      setTransfers(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch transfers", error);
    } finally {
      setLoading(false);
    }
  };

  const { DeleteDialog, confirmDelete } = useDeleteDialog(
    (id) => axios.delete(`/transfer/${id}`),
    {
      onSuccess: fetchTransfers,
      successMessage: "Transfer record deleted",
      title: "Delete Transfer Record",
      description:
        "Are you sure? This will delete the history record but NOT revert the stock.",
    },
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search item code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64"
            />
            <Button onClick={() => setShowModal(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> New Transfer
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm dark:bg-zinc-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Transferred By</TableHead>
                {user?.role === "super admin" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {new Date(transfer.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transfer.itemCode}
                  </TableCell>
                  <TableCell>{transfer.itemName}</TableCell>
                  <TableCell>{transfer.fromWarehouse}</TableCell>
                  <TableCell>{transfer.toWarehouse}</TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>{transfer.user?.username}</TableCell>
                  {user?.role === "super admin" && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => confirmDelete(transfer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {transfers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No transfer history found.
                  </TableCell>
                </TableRow>
              )}
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

        {showModal && (
          <TransferModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              fetchTransfers();
              setShowModal(false);
            }}
          />
        )}

        <DeleteDialog />
      </div>
    </DashboardLayout>
  );
}

function TransferModal({ onClose, onSuccess }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fromWarehouse: "",
      toWarehouse: "",
      items: [{ itemCode: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedItemSearch = useDebounce(searchQuery, 300);
  const fromWarehouse = watch("fromWarehouse");

  // Fetch inventory when warehouse changes or search query changes
  useEffect(() => {
    if (fromWarehouse) {
      const fetchInventory = async () => {
        try {
          const res = await axios.get("/inventory", {
            params: {
              warehouse: fromWarehouse,
              search: debouncedItemSearch,
              limit: 20, // Limit results for dropdown
            },
          });
          setInventoryItems(res.data.items);
        } catch (error) {
          console.error("Failed to fetch inventory", error);
        }
      };
      fetchInventory();
    } else {
      setInventoryItems([]);
    }
  }, [fromWarehouse, debouncedItemSearch]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await axios.post("/transfer", data);
      toast.success("Stock transfer successful");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Warehouse</Label>
              <Select onValueChange={(val) => setValue("fromWarehouse", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAAN">JAAN</SelectItem>
                  <SelectItem value="DW">DW</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Warehouse</Label>
              <Select onValueChange={(val) => setValue("toWarehouse", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JAAN">JAAN</SelectItem>
                  <SelectItem value="DW">DW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                Items to Transfer
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ itemCode: "", quantity: 1 })}
                disabled={!fromWarehouse}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end border p-4 rounded-md"
              >
                <div className="col-span-7 space-y-2">
                  <Label>Item (Search)</Label>
                  <Select
                    onValueChange={(val) =>
                      setValue(`items.${index}.itemCode`, val)
                    }
                    disabled={!fromWarehouse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-popover z-10">
                        <Input
                          placeholder="Search item..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()} // Prevent closing select on space
                          className="mb-2 h-8"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {inventoryItems.map((item) => (
                          <SelectItem
                            key={item.id}
                            value={item.code}
                            disabled={item.quantity <= 0}
                          >
                            {item.code} - {item.name} (Qty: {item.quantity})
                          </SelectItem>
                        ))}
                        {inventoryItems.length === 0 && (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No items found
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    {...register(`items.${index}.quantity`, {
                      required: true,
                      min: 1,
                    })}
                    min="1"
                  />
                </div>
                <div className="col-span-1">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Transfer Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
