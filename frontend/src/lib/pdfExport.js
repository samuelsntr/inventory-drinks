import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/lib/formatDate";

const addFooter = (doc) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 80,
      doc.internal.pageSize.getHeight() - 20
    );
  }
};

const addHeader = (doc, title) => {
  const width = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Inventory Drinks", 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(title, 40, 60);
  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.line(40, 70, width - 40, 70);
};

export const exportCheckoutPDF = (batch) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 40;
  addHeader(doc, "Checkout Report");

  const createdAt = batch.createdAt ? new Date(batch.createdAt) : new Date();
  const meta = [
    { label: "Warehouse", value: batch.warehouse || "-" },
    { label: "Reason", value: batch.reason || "-" },
    { label: "Checked Out By", value: batch.user?.username || "-" },
    { label: "Date", value: formatDate(createdAt, true) },
    { label: "Items Count", value: String(batch.totalItems ?? batch.items?.length ?? 0) },
    {
      label: "Total Quantity",
      value: String(
        batch.totalQuantity ??
          (batch.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)
      ),
    },
  ];

  doc.setFontSize(11);
  let y = 95;
  meta.forEach((m) => {
    doc.text(`${m.label}:`, marginLeft, y);
    doc.setFont("helvetica", "bold");
    doc.text(String(m.value), marginLeft + 120, y);
    doc.setFont("helvetica", "normal");
    y += 18;
  });

  const items = [...(batch.items || [])].sort((a, b) =>
    String(a.itemCode).localeCompare(String(b.itemCode))
  );

  autoTable(doc, {
    startY: y + 10,
    head: [["Item Code", "Item Name", "Quantity"]],
    body: items.map((it) => [it.itemCode, it.itemName, String(it.quantity)]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [33, 33, 33], textColor: 255 },
    theme: "striped",
  });

  addFooter(doc);
  const filenameDate =
    createdAt instanceof Date ? createdAt.toISOString().split("T")[0] : "date";
  doc.save(`checkout_${batch.id || "batch"}_${filenameDate}.pdf`);
};

export const exportTransferPDF = (batch) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginLeft = 40;
  addHeader(doc, "Stock Transfer Report");

  const createdAt = batch.createdAt ? new Date(batch.createdAt) : new Date();
  const meta = [
    { label: "From", value: batch.fromWarehouse || "-" },
    { label: "To", value: batch.toWarehouse || "-" },
    { label: "Transferred By", value: batch.user?.username || "-" },
    { label: "Date", value: formatDate(createdAt, true) },
    { label: "Items Count", value: String(batch.totalItems ?? batch.items?.length ?? 0) },
    {
      label: "Total Quantity",
      value: String(
        batch.totalQuantity ??
          (batch.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0)
      ),
    },
  ];

  doc.setFontSize(11);
  let y = 95;
  meta.forEach((m) => {
    doc.text(`${m.label}:`, marginLeft, y);
    doc.setFont("helvetica", "bold");
    doc.text(String(m.value), marginLeft + 120, y);
    doc.setFont("helvetica", "normal");
    y += 18;
  });

  const items = [...(batch.items || [])].sort((a, b) =>
    String(a.itemCode).localeCompare(String(b.itemCode))
  );

  autoTable(doc, {
    startY: y + 10,
    head: [["Item Code", "Item Name", "Quantity"]],
    body: items.map((it) => [it.itemCode, it.itemName, String(it.quantity)]),
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [33, 33, 33], textColor: 255 },
    theme: "striped",
  });

  addFooter(doc);
  const filenameDate =
    createdAt instanceof Date ? createdAt.toISOString().split("T")[0] : "date";
  doc.save(`transfer_${batch.id || "batch"}_${filenameDate}.pdf`);
};
