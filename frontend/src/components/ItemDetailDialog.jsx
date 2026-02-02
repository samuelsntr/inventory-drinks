import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function ItemDetailDialog({ item, onClose }) {
  if (!item) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Item Details: {item.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div>
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-auto rounded-lg border object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground">Code</Label>
                <p className="font-medium">{item.code}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium">{item.category || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground">Price</Label>
                <p className="font-medium">Rp {parseInt(item.price).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Quantity</Label>
                <p>
                    <Badge variant={item.quantity > 0 ? "default" : "destructive"}>
                        {item.quantity}
                    </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-muted-foreground">Warehouse</Label>
                <p className="font-medium">{item.warehouse}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Condition</Label>
                <p>
                    <Badge variant={item.condition === 'good' ? "outline" : "secondary"}>
                        {item.condition}
                    </Badge>
                </p>
              </div>
            </div>

            <div>
                <Label className="text-muted-foreground">Last Updated By</Label>
                <p className="font-medium">{item.lastUpdatedBy?.username || "-"}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Note</Label>
              <p className="text-sm text-gray-700 whitespace-pre-wrap border p-2 rounded-md bg-gray-50 min-h-[80px]">
                {item.note || "No notes available."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
