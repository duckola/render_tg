import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { userService, StaffPerformance } from '../../services/userService';
import '../../styles/admin.css';
import './Dashboard.css';

export const AdminDashboard = () => {
  const { user } = useAuthStore();

  const { data: staffPerformance, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staffPerformance'],
    queryFn: userService.getStaffPerformance,
  });

  // Mock orders data for statistics (in real app, fetch from API)
  const orders: any[] = [];

  // Calculate statistics
  const stats = {
    newOrders: orders.filter((o: any) => o.status === 'PENDING' || o.status === 'PENDING_PAYMENT').length,
    preparing: orders.filter((o: any) => o.status === 'PREPARING').length,
    completed: orders.filter((o: any) => o.status === 'COMPLETED').length,
    totalSales: orders.reduce((sum: number, o: any) => sum + (Number.parseFloat(o.totalPrice) || 0), 0),
  };

  // Mock sales data for the chart (in a real app, this would come from the backend)
  const salesData = [
    { month: 'Jul', value: 200 },
    { month: 'Aug', value: 350 },
    { month: 'Sep', value: 450 },
    { month: 'Oct', value: 520 },
    { month: 'Nov', value: 600 },
    { month: 'Dec', value: 750 },
    { month: 'Jan', value: 800 },
  ];

  // Top selling items (mock data - in real app, calculate from order items)
  const topSales = [
    { name: 'Chicken Inasal', sales: 120 },
    { name: 'Biggest beepsteek', sales: 85 },
    { name: 'Stepehen Kare', sales: 65 },
  ];

  const maxSales = Math.max(...topSales.map((item) => item.sales));

  return (
    <div className="admin-dashboard">
        {/* Dashboard Cards Grid */}
        <div className="dashboard-grid">
          {/* Sales Overview Card */}
          <div className="dashboard-card sales-overview-card">
            <h3 className="card-title">Sales Overview</h3>
            <div className="chart-container">
              <svg viewBox="0 0 400 200" className="sales-chart">
                <defs>
                  <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#550508" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#550508" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[0, 200, 400, 600, 800].map((val) => (
                  <g key={`grid-${val}`}>
                    <line
                      x1="40"
                      y1={180 - (val / 800) * 160}
                      x2="380"
                      y2={180 - (val / 800) * 160}
                      stroke="#e0e0e0"
                      strokeWidth="1"
                    />
                    <text
                      x="35"
                      y={180 - (val / 800) * 160}
                      fontSize="10"
                      fill="#999"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                ))}
                {/* Chart line */}
                <polyline
                  points={salesData
                    .map(
                      (d, idx) =>
                        `${40 + (idx * 340) / (salesData.length - 1)},${180 - (d.value / 800) * 160}`
                    )
                    .join(' ')}
                  fill="none"
                  stroke="#550508"
                  strokeWidth="3"
                />
                {/* Filled area under line */}
                <polygon
                  points={`40,180 ${salesData
                    .map(
                      (d, idx) =>
                        `${40 + (idx * 340) / (salesData.length - 1)},${180 - (d.value / 800) * 160}`
                    )
                    .join(' ')} 380,180`}
                  fill="url(#salesGradient)"
                />
                {/* Data points */}
                {salesData.map((d, idx) => (
                  <circle
                    key={`point-${d.month}`}
                    cx={40 + (idx * 340) / (salesData.length - 1)}
                    cy={180 - (d.value / 800) * 160}
                    r="4"
                    fill="#550508"
                  />
                ))}
                {/* X-axis labels */}
                {salesData.map((d, idx) => (
                  <text
                    key={`label-${d.month}`}
                    x={40 + (idx * 340) / (salesData.length - 1)}
                    y="195"
                    fontSize="10"
                    fill="#666"
                    textAnchor="middle"
                  >
                    {d.month}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Top Sales Card */}
          <div className="dashboard-card top-sales-card">
            <h3 className="card-title">Top Sales</h3>
            <div className="top-sales-list">
              {topSales.map((item) => (
                <div key={item.name} className="top-sales-item">
                  <span className="sales-item-name">{item.name}</span>
                  <div className="sales-bar-container">
                    <div
                      className="sales-bar"
                      style={{ width: `${(item.sales / maxSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Performance Card */}
          <div className="dashboard-card staff-performance-card">
            <h3 className="card-title">Staff Performance</h3>
            {isLoadingStaff ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
            ) : staffPerformance && staffPerformance.length > 0 ? (
              <div className="staff-list">
                {staffPerformance.map((staff: StaffPerformance) => (
                  <div key={staff.userId} className="staff-item">
                    <div className="staff-header">
                      <div className="staff-name">{staff.fullName}</div>
                      <div className="staff-id">{staff.schoolId}</div>
                    </div>
                    <div className="staff-metrics">
                      <div className="metric">
                        <span className="metric-label">Total Orders:</span>
                        <span className="metric-value">{staff.totalOrdersProcessed}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Completed:</span>
                        <span className="metric-value">{staff.completedOrders}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Pending:</span>
                        <span className="metric-value">{staff.pendingOrders}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Completion Rate:</span>
                        <span className="metric-value">{staff.completionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No staff members found
              </div>
            )}
          </div>

          {/* Generate Report Card */}
          <div className="dashboard-card generate-report-card">
            <h3 className="card-title">Generate Report</h3>
            <div className="report-form">
              <div className="form-group">
                <label htmlFor="report-type">Report Type</label>
                <select id="report-type" className="form-select">
                  <option>Sales</option>
                  <option>Orders</option>
                  <option>Inventory</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="date-range">Date Range</label>
                <div className="date-inputs">
                  <div className="date-input-wrapper">
                    <input type="date" className="form-input" />
                    <i className="fa-solid fa-calendar date-icon"></i>
                  </div>
                  <span className="date-separator">to</span>
                  <div className="date-input-wrapper">
                    <input type="date" className="form-input" />
                    <i className="fa-solid fa-calendar date-icon"></i>
                  </div>
                </div>
              </div>
              <button className="generate-btn">
                <i className="fa-solid fa-file-export"></i> Generate
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
