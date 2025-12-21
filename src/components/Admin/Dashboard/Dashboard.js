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
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("Không tìm thấy token!");
          setLoading(false);
          return;
        }

        const [statsRes, chartsRes] = await Promise.all([
          fetch("http://localhost:5001/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5001/api/admin/dashboard-charts?months=12", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (chartsRes.ok) {
          const chartData = await chartsRes.json();
          console.log("Dữ liệu nhận được từ MySQL:", chartData);

          // Xử lý dữ liệu Doanh thu
          let revLabels = chartData?.revenue?.labels || [];
          let revValues = chartData?.revenue?.values || [];

          // Xử lý dữ liệu Người dùng
          let userLabels = chartData?.users?.labels || [];
          let userValues = chartData?.users?.values || [];

          // --- LOGIC HIỂN THỊ DỮ LIỆU ---
          // Nếu cả 2 đều rỗng mới hiện Fake Data để bạn biết là chưa lấy được dữ liệu thật
          if (revLabels.length === 0 && userLabels.length === 0) {
            console.warn("Database rỗng hoặc không khớp điều kiện! Hiển thị Fake Data.");
            revLabels = ["Tháng 10", "Tháng 11", "Tháng 12"];
            revValues = [500000, 1200000, 850000];
            userLabels = ["Tháng 10", "Tháng 11", "Tháng 12"];
            userValues = [10, 25, 15];
          }

          setCharts({
            revenue: { labels: revLabels, values: revValues },
            users: { labels: userLabels, values: userValues },
          });
        }
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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