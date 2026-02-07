import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaginationControls from "@/components/PaginationControls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import { FileText, Calendar as CalendarIcon, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userFilter, setUserFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedLog, setSelectedLog] = useState(null);

  const debouncedUser = useDebounce(userFilter, 500);
  const debouncedAction = useDebounce(actionFilter, 500);
  const debouncedEntity = useDebounce(entityFilter, 500);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedUser,
    debouncedAction,
    debouncedEntity,
    dateRange?.from,
    dateRange?.to,
  ]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/logs", {
        params: {
          page,
          limit: 10,
          user: debouncedUser || undefined,
          action: debouncedAction || undefined,
          entityType: debouncedEntity || undefined,
          startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
          endDate: dateRange?.to
            ? (() => {
                const end = new Date(dateRange.to);
                end.setHours(23, 59, 59, 999);
                return end.toISOString();
              })()
            : undefined,
        },
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const isAllowed = user?.role === "admin" || user?.role === "super admin";

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Audit Logs
          </h1>
        </div>

        {!isAllowed ? (
          <div className="rounded-md border bg-white dark:bg-zinc-950 p-6">
            <p className="text-red-600 font-medium">
              Access denied. Admin privileges required.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                placeholder="Filter by user..."
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-56"
              />
              <Input
                placeholder="Filter by action..."
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-56"
              />
              <Input
                placeholder="Filter by entity..."
                value={entityFilter}
                onChange={(e) => {
                  setEntityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-56"
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

            <div className="rounded-md border bg-white shadow-sm dark:bg-zinc-950">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <Spinner />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {log.createdAt
                            ? formatDate(log.createdAt, true)
                            : "-"}
                        </TableCell>
                        <TableCell>{log.username || "-"}</TableCell>
                        <TableCell>{log.role || "-"}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.entityType || "-"}</TableCell>
                        <TableCell>{log.entityId || "-"}</TableCell>
                        <TableCell className="truncate max-w-[24rem]">
                          {log.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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

            {selectedLog && (
              <Dialog open={true} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="sm:max-w-[40vw] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Log Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-40">User</span>
                      <span className="font-medium">
                        {selectedLog.username || "-"} ({selectedLog.role || "-"}
                        )
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-40">Action</span>
                      <span className="font-medium">{selectedLog.action}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-40">Entity</span>
                      <span className="font-medium">
                        {selectedLog.entityType || "-"} #
                        {selectedLog.entityId || "-"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-40">IP</span>
                      <span className="font-medium">
                        {selectedLog.ip || "-"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground w-40">
                        User Agent
                      </span>
                      <span className="font-medium">
                        {selectedLog.userAgent || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Description</span>
                      <div className="rounded-md border p-3 bg-background">
                        {selectedLog.description || "-"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Metadata</span>
                      <div className="rounded-md border p-3 bg-background text-xs overflow-x-auto">
                        {selectedLog.metadata
                          ? (() => {
                              try {
                                const obj = JSON.parse(selectedLog.metadata);
                                return (
                                  <pre>{JSON.stringify(obj, null, 2)}</pre>
                                );
                              } catch {
                                return <pre>{selectedLog.metadata}</pre>;
                              }
                            })()
                          : "-"}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
