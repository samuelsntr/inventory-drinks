import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/axios";
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
import {
  Plus,
  Trash2,
  ArrowRightLeft,
  Search,
  Calendar as CalendarIcon,
  Eye,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import PaginationControls from "@/components/PaginationControls";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useDeleteDialog } from "@/hooks/useDeleteDialog";

export default function StockTransfer() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailBatch, setDetailBatch] = useState(null);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebounce(search, 500);
  const [dateRange, setDateRange] = useState({ from: null, to: null });

  useEffect(() => {
    fetchTransfers();
  }, [debouncedSearch, page, dateRange?.from, dateRange?.to]);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/transfer/history", {
        params: {
          search: debouncedSearch,
          page: page,
          limit: 10,
          startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
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
    (id) => api.delete(`/transfer/${id}`),
    {
      onSuccess: fetchTransfers,
      successMessage: "Transfer record deleted and stock reverted",
      title: "Delete Transfer Record",
      description:
        "Are you sure? This will move stock back to the source and delete the record.",
    },
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Stock Transfers
            </h1>
            <Button onClick={() => setShowModal(true)}>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> New Transfer
            </Button>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Search item code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-64"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-64 justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from && dateRange?.to
                    ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`
                    : "Filter by date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range || { from: null, to: null });
                    setPage(1);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {dateRange?.from && dateRange?.to && (
              <Badge variant="outline" className="h-9 px-3">
                <CalendarIcon className="mr-1" />
                {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-md border bg-white shadow-sm dark:bg-zinc-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Transferred By</TableHead>
                {user?.role === "super admin" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    {new Date(batch.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{batch.fromWarehouse}</TableCell>
                  <TableCell>{batch.toWarehouse}</TableCell>
                  <TableCell>{batch.totalItems}</TableCell>
                  <TableCell>{batch.totalQuantity}</TableCell>
                  <TableCell>{batch.user?.username}</TableCell>
                  {user?.role === "super admin" && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDetailBatch(batch)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDelete(batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

        {detailBatch && (
          <Dialog open={true} onOpenChange={() => setDetailBatch(null)}>
            <DialogContent className="sm:max-w-[40vw] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Transfer Details</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-4">
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    From
                  </span>
                  <span className="font-medium">
                    {detailBatch.fromWarehouse}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">To</span>
                  <span className="font-medium">{detailBatch.toWarehouse}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-muted-foreground w-40">
                    Transferred By
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
      fromWarehouse: "DW",
      toWarehouse: "JAAN",
      items: [{ itemCode: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [rowSearch, setRowSearch] = useState({});
  const fromWarehouse = watch("fromWarehouse");
  const toWarehouse = watch("toWarehouse");
  const itemsValue = watch("items");
  const totalItems = itemsValue?.length || 0;
  const totalQuantity =
    itemsValue?.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) || 0;

  // Fetch inventory when warehouse changes or search query changes
  useEffect(() => {
    if (fromWarehouse) {
      const fetchInventory = async () => {
        try {
          const res = await api.get("/inventory", {
            params: {
              warehouse: fromWarehouse,
              limit: 1000, // Limit results for dropdown
            },
          });
          setInventoryItems(res.data.items);
        } catch (error) {
          console.error("Failed to fetch inventory", error);
        }
      };
      fetchInventory();
      setRowSearch({});
    } else {
      setInventoryItems([]);
      setRowSearch({});
    }
  }, [fromWarehouse]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await api.post("/transfer", data);
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
      <DialogContent className="sm:max-w-[50vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="rounded-md border bg-muted/40 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Route</p>
                  <p className="font-medium">
                    {fromWarehouse || "Select source"}
                    <span className="mx-1">→</span>
                    {toWarehouse || "Select destination"}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground">
                <span>
                  Items:{" "}
                  <span className="font-semibold text-foreground">
                    {totalItems}
                  </span>
                </span>
                <span>
                  Total Qty:{" "}
                  <span className="font-semibold text-foreground">
                    {totalQuantity}
                  </span>
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Warehouse</Label>
                <Select
                  value={fromWarehouse}
                  onValueChange={(val) => setValue("fromWarehouse", val)}
                >
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
                <Select
                  value={toWarehouse}
                  onValueChange={(val) => setValue("toWarehouse", val)}
                >
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
                className="grid grid-cols-12 gap-4 items-end rounded-md border bg-background/80 dark:bg-zinc-900 p-4 shadow-sm"
              >
                <div className="col-span-7 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Item {index + 1}
                  </p>
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
                          value={rowSearch[field.id] ?? ""}
                          onChange={(e) =>
                            setRowSearch((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => e.stopPropagation()} // Prevent closing select on space
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
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              <span>
                Items:{" "}
                <span className="font-semibold text-foreground">
                  {totalItems}
                </span>
              </span>
              <span className="mx-2">•</span>
              <span>
                Total Qty:{" "}
                <span className="font-semibold text-foreground">
                  {totalQuantity}
                </span>
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !fromWarehouse || !toWarehouse}
              >
                {loading ? "Processing..." : "Transfer Stock"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
