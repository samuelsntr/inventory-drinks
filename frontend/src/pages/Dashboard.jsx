import React from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import DashboardSummary from "../components/dashboard/DashboardSummary";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardSummary />
    </DashboardLayout>
  );
};

export default Dashboard;
