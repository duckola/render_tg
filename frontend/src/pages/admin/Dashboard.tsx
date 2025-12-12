import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { userService, StaffPerformance } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { inventoryService } from '../../services/inventoryService';
import { Order, OrderItem, Inventory } from '../../types';
import toast from 'react-hot-toast';
import '../../styles/admin.css';
import './Dashboard.css';

export const AdminDashboard = () => {
  const { data: staffPerformance, isLoading: isLoadingStaff } = useQuery({
    queryKey: ['staffPerformance'],
    queryFn: userService.getStaffPerformance,
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['allOrders'],
    queryFn: orderService.getAllOrders,
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.getAll,
  });

  // Report generation state
  const [reportType, setReportType] = useState<string>('Sales');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');


  // Calculate statistics from real orders
  const stats = useMemo(() => {
    if (!orders) {
      return {
        newOrders: 0,
        preparing: 0,
        completed: 0,
        totalSales: 0,
      };
    }

    // Only count COMPLETED orders for total sales (case-insensitive check)
    const completedOrders = orders.filter((o: Order) => {
      const status = (o.status || '').trim().toUpperCase();
      return status === 'COMPLETED';
    });
    
    return {
      newOrders: orders.filter((o: Order) => {
        const status = (o.status || '').trim().toUpperCase();
        return status === 'PENDING' || status === 'PENDING_PAYMENT';
      }).length,
      preparing: orders.filter((o: Order) => {
        const status = (o.status || '').trim().toUpperCase();
        return status === 'PREPARING' || status === 'ACCEPTED';
      }).length,
      completed: completedOrders.length,
      totalSales: completedOrders.reduce(
        (sum: number, o: Order) => sum + (o.totalPrice || 0),
        0
      ),
    };
  }, [orders]);

  // Calculate monthly sales data from orders
  const salesData = useMemo(() => {
    if (!orders) return [];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales: { [key: string]: number } = {};

    // Get last 7 months
    const now = new Date();
    const last7Months: { month: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlySales[monthKey] = 0;
      last7Months.push({
        month: monthNames[date.getMonth()],
        value: 0,
      });
    }

    // Calculate sales for each month from completed orders
    orders
      .filter((o: Order) => o.status === 'COMPLETED' && o.orderTime)
      .forEach((order: Order) => {
        const orderDate = new Date(order.orderTime);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthKey in monthlySales) {
          monthlySales[monthKey] += order.totalPrice || 0;
        }
      });

    // Map to the last 7 months array
    let monthIndex = 0;
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      last7Months[monthIndex].value = monthlySales[monthKey] || 0;
      monthIndex++;
    }

    return last7Months;
  }, [orders]);

  // Calculate top selling items from order items
  const topSales = useMemo(() => {
    if (!orders) return [];

    const itemSales: { [key: number]: { name: string; sales: number } } = {};

    // Aggregate sales from completed orders only (not READY, only COMPLETED)
    orders
      .filter((o: Order) => {
        const status = (o.status || '').trim().toUpperCase();
        return status === 'COMPLETED';
      })
      .forEach((order: Order) => {
        const orderItems = order.orderItems || order.items || [];
        orderItems.forEach((item: OrderItem) => {
          if (item.menuItem) {
            const itemId = item.menuItem.itemId;
            if (!itemSales[itemId]) {
              itemSales[itemId] = {
                name: item.menuItem.name || 'Unknown Item',
                sales: 0,
              };
            }
            itemSales[itemId].sales += item.quantity || 0;
          }
        });
      });

    // Convert to array and sort by sales
    return Object.values(itemSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5 items
  }, [orders]);

  const maxSales = topSales.length > 0 
    ? Math.max(...topSales.map((item) => item.sales), 1)
    : 1;

  const maxChartValue = salesData.length > 0
    ? Math.max(...salesData.map((d) => d.value), 1)
    : 1;

  // CSV Export Functions
  const convertToCSV = (data: any[], headers: string[]): string => {
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filterByDateRange = (data: any[], dateField: string): any[] => {
    if (!startDate && !endDate) return data;
    
    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && itemDate < start) return false;
      if (end) {
        // Include the entire end date
        const endOfDay = new Date(end);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  };

  const generateSalesReport = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders available for report');
      return;
    }

    const filteredOrders = filterByDateRange(orders, 'orderTime');
    const completedOrders = filteredOrders.filter((o: Order) => {
      const status = (o.status || '').trim().toUpperCase();
      return status === 'COMPLETED';
    });

    const salesData = completedOrders.map((order: Order) => ({
      'Order ID': order.orderId,
      'Order Date': new Date(order.orderTime).toLocaleDateString(),
      'Order Time': new Date(order.orderTime).toLocaleTimeString(),
      'Customer': order.userId,
      'Status': order.status,
      'Total Amount': `₱${(order.totalPrice || 0).toFixed(2)}`,
      'Payment Method': order.paymentMethod || 'N/A',
      'Items Count': (order.orderItems || order.items || []).length,
    }));

    const summary = {
      'Total Orders': completedOrders.length,
      'Total Revenue': `₱${completedOrders.reduce((sum: number, o: Order) => sum + (o.totalPrice || 0), 0).toFixed(2)}`,
      'Average Order Value': `₱${(completedOrders.reduce((sum: number, o: Order) => sum + (o.totalPrice || 0), 0) / (completedOrders.length || 1)).toFixed(2)}`,
    };

    const csvContent = `Sales Report${startDate || endDate ? ` (${startDate || 'All'} to ${endDate || 'All'})` : ''}\nGenerated: ${new Date().toLocaleString()}\n\nSummary\n${Object.entries(summary).map(([key, value]) => `${key},${value}`).join('\n')}\n\nOrder Details\n${convertToCSV(salesData, ['Order ID', 'Order Date', 'Order Time', 'Customer', 'Status', 'Total Amount', 'Payment Method', 'Items Count'])}`;

    downloadCSV(csvContent, `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Sales report generated successfully!');
  };

  const generateOrdersReport = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders available for report');
      return;
    }

    const filteredOrders = filterByDateRange(orders, 'orderTime');

    const ordersData = filteredOrders.map((order: Order) => {
      const orderItems = order.orderItems || order.items || [];
      const itemsList = orderItems.map((item: OrderItem) => 
        `${item.menuItem?.name || 'Unknown'} (x${item.quantity})`
      ).join('; ');

      return {
        'Order ID': order.orderId,
        'Order Date': new Date(order.orderTime).toLocaleDateString(),
        'Order Time': new Date(order.orderTime).toLocaleTimeString(),
        'Customer ID': order.userId,
        'Status': order.status,
        'Total Amount': `₱${(order.totalPrice || 0).toFixed(2)}`,
        'Payment Method': order.paymentMethod || 'N/A',
        'Is Preorder': order.isPreorder ? 'Yes' : 'No',
        'Pickup Time': order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'N/A',
        'Items': itemsList,
        'Note': order.note || 'N/A',
      };
    });

    const csvContent = `Orders Report${startDate || endDate ? ` (${startDate || 'All'} to ${endDate || 'All'})` : ''}\nGenerated: ${new Date().toLocaleString()}\n\n${convertToCSV(ordersData, ['Order ID', 'Order Date', 'Order Time', 'Customer ID', 'Status', 'Total Amount', 'Payment Method', 'Is Preorder', 'Pickup Time', 'Items', 'Note'])}`;

    downloadCSV(csvContent, `orders-report-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Orders report generated successfully!');
  };

  const generateInventoryReport = () => {
    if (!inventory || inventory.length === 0) {
      toast.error('No inventory data available for report');
      return;
    }

    const inventoryData = inventory.map((item: Inventory) => {
      const status = item.currentStock <= 0 
        ? 'Out of Stock' 
        : item.currentStock <= item.thresholdLevel 
        ? 'Low Stock' 
        : 'In Stock';

      return {
        'Item ID': item.itemId,
        'Item Name': item.itemName,
        'Current Stock': item.currentStock,
        'Threshold Level': item.thresholdLevel,
        'Status': status,
        'Stock Difference': item.currentStock - item.thresholdLevel,
      };
    });

    const summary = {
      'Total Items': inventory.length,
      'In Stock': inventory.filter((i: Inventory) => i.currentStock > i.thresholdLevel).length,
      'Low Stock': inventory.filter((i: Inventory) => i.currentStock > 0 && i.currentStock <= i.thresholdLevel).length,
      'Out of Stock': inventory.filter((i: Inventory) => i.currentStock <= 0).length,
    };

    const csvContent = `Inventory Report\nGenerated: ${new Date().toLocaleString()}\n\nSummary\n${Object.entries(summary).map(([key, value]) => `${key},${value}`).join('\n')}\n\nInventory Details\n${convertToCSV(inventoryData, ['Item ID', 'Item Name', 'Current Stock', 'Threshold Level', 'Status', 'Stock Difference'])}`;

    downloadCSV(csvContent, `inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Inventory report generated successfully!');
  };

  const handleGenerateReport = () => {
    if (reportType === 'Sales') {
      generateSalesReport();
    } else if (reportType === 'Orders') {
      generateOrdersReport();
    } else if (reportType === 'Inventory') {
      generateInventoryReport();
    }
  };

  return (
    <div className="admin-dashboard">
        {/* Statistics Cards */}
        <div className="stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div className="stat-card" style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>New Orders</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#550508' }}>
              {isLoadingOrders ? '...' : stats.newOrders}
            </div>
          </div>
          <div className="stat-card" style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Preparing</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#550508' }}>
              {isLoadingOrders ? '...' : stats.preparing}
            </div>
          </div>
          <div className="stat-card" style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Completed</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#550508' }}>
              {isLoadingOrders ? '...' : stats.completed}
            </div>
          </div>
          <div className="stat-card" style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Sales</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#550508' }}>
              ₱{isLoadingOrders ? '...' : stats.totalSales.toFixed(2)}
            </div>
          </div>
        </div>

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
                {/* Grid lines - dynamic based on max value */}
                {isLoadingOrders ? (
                  <text x="200" y="100" fontSize="14" fill="#999" textAnchor="middle">
                    Loading...
                  </text>
                ) : salesData.length === 0 ? (
                  <text x="200" y="100" fontSize="14" fill="#999" textAnchor="middle">
                    No sales data
                  </text>
                ) : (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const val = Math.round(ratio * maxChartValue);
                      return (
                        <g key={`grid-${val}`}>
                          <line
                            x1="40"
                            y1={180 - ratio * 160}
                            x2="380"
                            y2={180 - ratio * 160}
                            stroke="#e0e0e0"
                            strokeWidth="1"
                          />
                          <text
                            x="35"
                            y={180 - ratio * 160}
                            fontSize="10"
                            fill="#999"
                            textAnchor="end"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                  </>
                )}
                {/* Chart line */}
                {salesData.length > 0 && (
                  <>
                    <polyline
                      points={salesData
                        .map(
                          (d, idx) =>
                            `${40 + (idx * 340) / Math.max(salesData.length - 1, 1)},${180 - (d.value / maxChartValue) * 160}`
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
                            `${40 + (idx * 340) / Math.max(salesData.length - 1, 1)},${180 - (d.value / maxChartValue) * 160}`
                        )
                        .join(' ')} ${40 + ((salesData.length - 1) * 340) / Math.max(salesData.length - 1, 1)},180`}
                      fill="url(#salesGradient)"
                    />
                    {/* Data points */}
                    {salesData.map((d, idx) => (
                      <circle
                        key={`point-${d.month}`}
                        cx={40 + (idx * 340) / Math.max(salesData.length - 1, 1)}
                        cy={180 - (d.value / maxChartValue) * 160}
                        r="4"
                        fill="#550508"
                      />
                    ))}
                    {/* X-axis labels */}
                    {salesData.map((d, idx) => (
                      <text
                        key={`label-${d.month}`}
                        x={40 + (idx * 340) / Math.max(salesData.length - 1, 1)}
                        y="195"
                        fontSize="10"
                        fill="#666"
                        textAnchor="middle"
                      >
                        {d.month}
                      </text>
                    ))}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Top Sales Card */}
          <div className="dashboard-card top-sales-card">
            <h3 className="card-title">Top Sales</h3>
            {isLoadingOrders ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
            ) : topSales.length > 0 ? (
              <div className="top-sales-list">
                {topSales.map((item) => (
                  <div key={item.name} className="top-sales-item">
                    <span className="sales-item-name">{item.name}</span>
                    <div className="sales-bar-container">
                      <div
                        className="sales-bar"
                        style={{ width: `${(item.sales / maxSales) * 100}%` }}
                      ></div>
                      <span className="sales-count">{item.sales}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No sales data available
              </div>
            )}
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
                <select 
                  id="report-type" 
                  className="form-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Sales">Sales</option>
                  <option value="Orders">Orders</option>
                  <option value="Inventory">Inventory</option>
                </select>
              </div>
              {reportType !== 'Inventory' && (
                <div className="form-group">
                  <label htmlFor="date-range">Date Range (Optional)</label>
                  <div className="date-inputs">
                    <div className="date-input-wrapper">
                      <input 
                        type="date" 
                        className="form-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <i className="fa-solid fa-calendar date-icon"></i>
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input-wrapper">
                      <input 
                        type="date" 
                        className="form-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                      />
                      <i className="fa-solid fa-calendar date-icon"></i>
                    </div>
                  </div>
                </div>
              )}
              <button 
                className="generate-btn"
                onClick={handleGenerateReport}
                disabled={
                  (reportType === 'Sales' || reportType === 'Orders') && 
                  isLoadingOrders
                }
              >
                <i className="fa-solid fa-file-export"></i> Generate
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
