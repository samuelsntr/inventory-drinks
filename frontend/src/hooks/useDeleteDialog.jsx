import { useState, useCallback } from "react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

export function useDeleteDialog(deleteFn, options = {}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [loading, setLoading] = useState(false);

  const confirmDelete = useCallback((id) => {
    setTargetId(id);
    setOpen(true);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await deleteFn(targetId);
      options.onSuccess?.();
      toast.success(options.successMessage || "Item deleted successfully");
    } catch (err) {
      toast.error(
        options.errorMessage ||
          "Failed to delete: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const DeleteDialog = () => (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={setOpen}
      onCancel={() => setOpen(false)}
      onConfirm={handleConfirm}
      loading={loading}
      title={options.title || "Delete Item"}
      description={
        options.description || "Are you sure you want to delete this item?"
      }
    />
  );

  return { DeleteDialog, confirmDelete };
}
