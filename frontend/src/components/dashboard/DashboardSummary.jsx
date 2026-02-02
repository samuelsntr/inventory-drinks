import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardSummary() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Inventory Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Welcome to the Inventory Drinks Management System.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
            </CardHeader>
            <CardContent>
                Manage items for JAAN and DW warehouses.
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Stock Transfer</CardTitle>
            </CardHeader>
            <CardContent>
                Transfer stock between warehouses seamlessly.
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent>
                Checkout items for Bar, Open Bottle, and more.
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
