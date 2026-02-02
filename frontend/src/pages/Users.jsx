import DashboardLayout from "@/components/layout/DashboardLayout";
import UserTable from "@/components/UserTable";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Manajemen User</h2>
      </div>
      <UserTable />
    </DashboardLayout>
  );
}
