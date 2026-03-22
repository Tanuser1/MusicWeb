import React, { useMemo, useState, useEffect } from "react";
import "./Dashboard.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalAlbums: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const [charts, setCharts] = useState({
    revenue: { labels: [], values: [] },
    users: { labels: [], values: [] },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Gọi API lấy số liệu thống kê thật
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/admin/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê dashboard:", error);
      }
    };
    fetchStats();

    // 2. Giữ nguyên Mock Data cho biểu đồ (Charts)
    const MOCK_CHARTS = {
      revenue: {
        labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
        values: [100000, 200000, 0, 0, 0, 0, 0, 0, 550000, 450000, 600000, 550000],
      },
      users: {
        labels: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
        values: [3,10,0,0,0,0,0,0, 0,15, 20, 30, 45],
      },
    };

   
    setCharts(MOCK_CHARTS);
    setLoading(false);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  const revenueChartData = useMemo(() => ({
    labels: charts.revenue.labels,
    datasets: [{
      label: "Doanh thu (VND)",
      data: charts.revenue.values,
      backgroundColor: "rgba(227, 80, 80, 0.7)",
      borderColor: "rgba(227, 80, 80, 1)",
      borderWidth: 1,
      borderRadius: 5,
    }],
  }), [charts.revenue]);

  const usersChartData = useMemo(() => ({
    labels: charts.users.labels,
    datasets: [{
      label: "Người dùng mới",
      data: charts.users.values,
      borderColor: "#4a90e2",
      backgroundColor: "rgba(74, 144, 226, 0.2)",
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointHoverRadius: 8,
    }],
  }), [charts.users]);

  if (loading) return <div className="loading-screen">Đang tải dữ liệu hệ thống...</div>;

  return (
    <div className="dashboard">
      <h2>Báo Cáo Quản Trị</h2>

      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>Bài Hát</h3>
          <p>{stats.totalSongs}</p>
        </div>
        <div className="stat-card green">
          <h3>Album</h3>
          <p>{stats.totalAlbums}</p>
        </div>
        <div className="stat-card orange">
          <h3>Người Dùng</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="stat-card red">
          <h3>Doanh Thu</h3>
          <p>{formatCurrency(stats.totalRevenue)}</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h3>Biểu đồ Doanh thu (Tháng)</h3>
          <div className="chart-container">
            <Bar data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="chart-card">
          <h3>Số lượng người mới đăng ký (Tháng)</h3>
          <div className="chart-container">
            <Line data={usersChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;