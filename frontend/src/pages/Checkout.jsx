import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
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
import { useDebounce } from "@/hooks/useDebounce";
import PaginationControls from "@/components/PaginationControls";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";
import { ArrowRightLeft, Trash2 } from "lucide-react";

export default function Checkout() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchHistory();
  }, [debouncedSearch, page]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/checkout/history", {
        params: {
          search: debouncedSearch,
          page: page,
          limit: 10,
        },
      });
      setHistory(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error("Failed to fetch checkout history", error);
    } finally {
      setLoading(false);
    }
  };

  const { DeleteDialog, confirmDelete } = useDeleteDialog(
    (id) => axios.delete(`/checkout/${id}`),
    {
      onSuccess: fetchHistory,
      successMessage: "Checkout record deleted",
      title: "Delete Checkout Record",
      description:
        "Are you sure? This will delete the history record but NOT revert the stock.",
    },
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search item code, name, or reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64"
            />
            <Button onClick={() => setShowModal(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> New Checkout
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
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Checked Out By</TableHead>
                {user?.role === "super admin" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.itemCode}
                  </TableCell>
                  <TableCell>{log.itemName}</TableCell>
                  <TableCell>{log.warehouse}</TableCell>
                  <TableCell>{log.quantity}</TableCell>
                  <TableCell>{log.reason}</TableCell>
                  <TableCell>{log.user?.username}</TableCell>
                  {user?.role === "super admin" && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => confirmDelete(log.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No checkout history found.
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
          <CheckoutModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              fetchHistory();
              setShowModal(false);
            }}
          />
        )}

        <DeleteDialog />
      </div>
    </DashboardLayout>
  );
}

function CheckoutModal({ onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      itemCode: "",
      quantity: 1,
      reasonSelect: "",
      reasonCustom: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedItemSearch = useDebounce(searchQuery, 300);
  const reasonValue = watch("reasonSelect");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get("/inventory", {
          params: {
            warehouse: "JAAN",
            search: debouncedItemSearch,
            limit: 20,
          },
        });
        setInventoryItems(res.data.items);
      } catch (error) {
        console.error("Failed to fetch inventory for checkout", error);
      }
    };

    fetchInventory();
  }, [debouncedItemSearch]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        itemCode: data.itemCode,
        quantity: data.quantity,
        reason:
          data.reasonSelect === "other" ? data.reasonCustom : data.reasonSelect,
      };

      await axios.post("/checkout", payload);
      toast.success("Checkout successful");
      reset();
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Checkout (From JAAN)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label>Item (Search from JAAN inventory)</Label>
            <Select
              onValueChange={(val) => {
                setValue("itemCode", val, { shouldValidate: true });
              }}
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
                    onKeyDown={(e) => e.stopPropagation()}
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
            {errors.itemCode && (
              <p className="text-sm text-red-500">
                {errors.itemCode.message}
              </p>
            )}
          </div>

          <input
            type="hidden"
            {...register("itemCode", {
              required: "Item is required",
            })}
          />

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              {...register("quantity", {
                required: "Quantity is required",
                min: 1,
              })}
              placeholder="Enter quantity"
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">
                {errors.quantity.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select onValueChange={(val) => setValue("reasonSelect", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bar">Bar</SelectItem>
                <SelectItem value="Open Bottle">Open Bottle</SelectItem>
                <SelectItem value="other">Other (Manual Input)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reasonValue === "other" && (
            <div className="space-y-2">
              <Label htmlFor="reasonCustom">Custom Reason</Label>
              <Input
                id="reasonCustom"
                {...register("reasonCustom", {
                  required: "Reason is required",
                })}
                placeholder="Enter reason"
              />
              {errors.reasonCustom && (
                <p className="text-sm text-red-500">
                  {errors.reasonCustom.message}
                </p>
              )}
            </div>
          )}

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
              {loading ? "Processing..." : "Checkout"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
