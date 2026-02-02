import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function InventoryForm({ item, warehouse, onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (item) {
      setValue("name", item.name);
      setValue("code", item.code);
      setValue("quantity", item.quantity);
      setValue("price", item.price);
      setValue("category", item.category);
      setValue("condition", item.condition);
      // setValue("image", item.image); // We handle image separately
      if (item.image) setImagePreview(item.image);
      setValue("note", item.note);
      setValue("warehouse", item.warehouse);
    } else {
      reset();
      setValue("warehouse", warehouse);
      setValue("condition", "good");
      setImagePreview(null);
    }
  }, [item, warehouse, setValue, reset]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("imageFile", file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("code", data.code);
      formData.append("quantity", data.quantity);
      formData.append("price", data.price);
      formData.append("category", data.category || "");
      formData.append("condition", data.condition);
      formData.append("note", data.note || "");
      formData.append("warehouse", data.warehouse);

      if (data.imageFile) {
        formData.append("imageFile", data.imageFile);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      if (item) {
        await api.put(`/inventory/${item.id}`, formData, config);
        toast.success("Item updated successfully");
      } else {
        await api.post("/inventory", formData, config);
        toast.success("Item created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input {...register("code", { required: "Code is required" })} />
              {errors.code && (
                <p className="text-sm text-red-500">{errors.code.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input {...register("name", { required: "Name is required" })} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input
                type="number"
                {...register("quantity", {
                  required: "Quantity is required",
                  min: 0,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                {...register("price", {
                  required: "Price is required",
                  min: 0,
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Input {...register("category")} />
            </div>
            <div className="space-y-1">
              <Label>Condition</Label>
              <Select
                onValueChange={(val) => setValue("condition", val)}
                defaultValue={item?.condition || "good"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="bad">Bad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Warehouse</Label>
            <Select
              onValueChange={(val) => setValue("warehouse", val)}
              defaultValue={warehouse}
              disabled={!!item}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JAAN">JAAN</SelectItem>
                <SelectItem value="DW">DW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Image</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded border"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Note</Label>
            <Textarea {...register("note")} />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
