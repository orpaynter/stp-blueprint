import React from 'react';
import StatCard from './StatCard';

interface DashboardOverviewProps {
  userRole: 'homeowner' | 'contractor' | 'supplier' | 'insurance';
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ userRole }) => {
  // Different stats based on user role
  const renderRoleSpecificStats = () => {
    switch (userRole) {
      case 'homeowner':
        return (
          <>
            <StatCard
              title="Active Projects"
              value="2"
              linkHref="/projects"
              linkText="View projects"
            />
            <StatCard
              title="Pending Assessments"
              value="1"
              linkHref="/assessments"
              linkText="View assessments"
            />
            <StatCard
              title="Open Claims"
              value="1"
              change="Submitted 3 days ago"
              trend="neutral"
              linkHref="/claims"
              linkText="View claims"
            />
            <StatCard
              title="Upcoming Appointments"
              value="2"
              linkHref="/appointments"
              linkText="View calendar"
            />
          </>
        );
      
      case 'contractor':
        return (
          <>
            <StatCard
              title="Active Jobs"
              value="8"
              change="+2 from last week"
              trend="up"
              linkHref="/jobs"
              linkText="View all jobs"
            />
            <StatCard
              title="Pending Estimates"
              value="5"
              change="+1 from yesterday"
              trend="up"
              linkHref="/estimates"
              linkText="View estimates"
            />
            <StatCard
              title="Today's Schedule"
              value="3 appointments"
              linkHref="/schedule"
              linkText="View schedule"
            />
            <StatCard
              title="Outstanding Invoices"
              value="$24,500"
              change="-$3,200 from last week"
              trend="down"
              linkHref="/invoices"
              linkText="View invoices"
            />
          </>
        );
      
      case 'supplier':
        return (
          <>
            <StatCard
              title="Inventory Items"
              value="342"
              change="+15 from last month"
              trend="up"
              linkHref="/inventory"
              linkText="View inventory"
            />
            <StatCard
              title="Pending Orders"
              value="12"
              change="+3 from yesterday"
              trend="up"
              linkHref="/orders"
              linkText="View orders"
            />
            <StatCard
              title="Scheduled Deliveries"
              value="8"
              linkHref="/deliveries"
              linkText="View deliveries"
            />
            <StatCard
              title="Monthly Revenue"
              value="$78,350"
              change="+12% from last month"
              trend="up"
              linkHref="/reports/revenue"
              linkText="View reports"
            />
          </>
        );
      
      case 'insurance':
        return (
          <>
            <StatCard
              title="Open Claims"
              value="27"
              change="+5 from last week"
              trend="up"
              linkHref="/claims"
              linkText="View claims"
            />
            <StatCard
              title="Pending Assessments"
              value="18"
              change="+2 from yesterday"
              trend="up"
              linkHref="/assessments"
              linkText="View assessments"
            />
            <StatCard
              title="Approved Claims"
              value="14"
              change="+3 from last week"
              trend="up"
              linkHref="/approvals"
              linkText="View approvals"
            />
            <StatCard
              title="Fraud Alerts"
              value="3"
              change="+1 from last week"
              trend="up"
              linkHref="/fraud-alerts"
              linkText="View alerts"
            />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-semibold text-neutral mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {renderRoleSpecificStats()}
      </div>
    </div>
  );
};

export default DashboardOverview;
