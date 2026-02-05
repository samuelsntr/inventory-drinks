import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  const [detailBatch, setDetailBatch] = useState(null);

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
      successMessage: "Checkout record deleted and stock reverted",
      title: "Delete Checkout Record",
      description:
        "Are you sure? This will revert stock back to JAAN and delete the record.",
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
                <TableHead>Warehouse</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Checked Out By</TableHead>
                {user?.role === "super admin" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    {new Date(batch.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{batch.warehouse}</TableCell>
                  <TableCell>{batch.totalItems}</TableCell>
                  <TableCell>{batch.totalQuantity}</TableCell>
                  <TableCell>{batch.reason}</TableCell>
                  <TableCell>{batch.user?.username}</TableCell>
                  {user?.role === "super admin" && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailBatch(batch)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => confirmDelete(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

        {detailBatch && (
          <Dialog open={true} onOpenChange={() => setDetailBatch(null)}>
            <DialogContent className="sm:max-w-[40vw] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Checkout Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Warehouse
                  </span>
                  <span className="font-medium">{detailBatch.warehouse}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Reason
                  </span>
                  <span className="font-medium break-words">
                    {detailBatch.reason || "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Checked Out By
                  </span>
                  <span className="font-medium">
                    {detailBatch.user?.username || "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Date
                  </span>
                  <span className="font-medium">
                    {detailBatch.createdAt
                      ? new Date(detailBatch.createdAt).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Items Count
                  </span>
                  <span className="font-medium">
                    {detailBatch.totalItems ?? (detailBatch.items?.length || 0)}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Total Quantity
                  </span>
                  <span className="font-medium">
                    {detailBatch.totalQuantity ??
                      (detailBatch.items?.reduce(
                        (sum, it) => sum + (it.quantity || 0),
                        0,
                      ) ||
                        0)}
                  </span>
                </div>
              </div>
              <div className="rounded-md border bg-white dark:bg-zinc-950">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailBatch.items && detailBatch.items.length > 0 ? (
                      <>
                        {[...(detailBatch.items || [])]
                          .sort((a, b) =>
                            String(a.itemCode).localeCompare(
                              String(b.itemCode),
                            ),
                          )
                          .map((it, idx) => (
                            <TableRow key={`${it.itemCode}-${idx}`}>
                              <TableCell className="font-medium">
                                {it.itemCode}
                              </TableCell>
                              <TableCell>{it.itemName}</TableCell>
                              <TableCell>{it.quantity}</TableCell>
                            </TableRow>
                          ))}
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-right font-medium"
                          >
                            Total
                          </TableCell>
                          <TableCell className="font-medium">
                            {detailBatch.totalQuantity ??
                              detailBatch.items.reduce(
                                (sum, it) => sum + (it.quantity || 0),
                                0,
                              )}
                          </TableCell>
                        </TableRow>
                      </>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center h-20 text-muted-foreground"
                        >
                          No items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setDetailBatch(null)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <DeleteDialog />
      </div>
    </DashboardLayout>
  );
}

function CheckoutModal({ onClose, onSuccess }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      items: [{ itemCode: "", quantity: 1 }],
      reasonSelect: "",
      reasonCustom: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [rowSearch, setRowSearch] = useState({});
  const reasonValue = watch("reasonSelect");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get("/inventory", {
          params: {
            warehouse: "JAAN",
            limit: 1000,
          },
        });
        setInventoryItems(res.data.items);
      } catch (error) {
        console.error("Failed to fetch inventory for checkout", error);
      }
    };

    fetchInventory();
  }, []);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const payload = {
        items: data.items.map((it) => ({
          itemCode: it.itemCode,
          quantity: it.quantity,
        })),
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
      <DialogContent className="sm:max-w-[50vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Checkout (From JAAN)</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">
                Items to Checkout (JAAN)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ itemCode: "", quantity: 1 })}
              >
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-12 gap-4 items-end border p-4 rounded-md"
              >
                <div className="col-span-7 space-y-2">
                  <Label>Item (Search from JAAN inventory)</Label>
                  <Select
                    onValueChange={(val) =>
                      setValue(`items.${index}.itemCode`, val, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2 sticky top-0 bg-popover z-10">
                        <Input
                          placeholder="Search item..."
                          value={rowSearch[field.id] ?? ""}
                          onChange={(e) =>
                            setRowSearch((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => e.stopPropagation()}
                          className="mb-2 h-8"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {(() => {
                          const q = (rowSearch[field.id] || "").toLowerCase();
                          const filtered = inventoryItems.filter((item) => {
                            if (!q) return true;
                            return (
                              item.code.toLowerCase().includes(q) ||
                              item.name.toLowerCase().includes(q)
                            );
                          });
                          return filtered.length > 0 ? (
                            filtered.map((item) => (
                              <SelectItem
                                key={item.id}
                                value={item.code}
                                disabled={item.quantity <= 0}
                              >
                                {item.code} - {item.name} (Qty: {item.quantity})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No items found
                            </div>
                          );
                        })()}
                      </div>
                    </SelectContent>
                  </Select>
                  {errors.items?.[index]?.itemCode && (
                    <p className="text-sm text-red-500">
                      {errors.items[index].itemCode.message}
                    </p>
                  )}
                </div>
                <div className="col-span-4 space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    {...register(`items.${index}.quantity`, {
                      required: "Quantity is required",
                      min: 1,
                    })}
                    placeholder="Enter quantity"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500">
                      {errors.items[index].quantity.message}
                    </p>
                  )}
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
