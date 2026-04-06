import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "../api/axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler,
} from "chart.js";
import { Doughnut, Chart as MixedChart } from "react-chartjs-2";
import Navbar from "../components/Navbar";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Filler
);

// ── helpers ──────────────────────────────────────────────────────

function buildDailyData(apiData, days = 30) {
  const map = {};
  apiData.forEach((d) => { map[d._id] = d.count; });
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push({ label: key.slice(5), count: map[key] || 0 });
  }
  return result;
}

function buildDeadlineData(apiData, days = 31) {
  const map = {};
  apiData.forEach((d) => { map[d._id] = d.count; });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    result.push({ label: key.slice(5), count: map[key] || 0, isToday: i === 0 });
  }
  return result;
}

function buildMatrix(matrixData) {
  const map = {};
  matrixData.forEach(({ _id, count }) => {
    if (!map[_id.priority]) map[_id.priority] = {};
    map[_id.priority][_id.status] = count;
  });
  return ["high", "medium", "low"].map((priority) => ({
    priority,
    todo: map[priority]?.todo || 0,
    inprogress: map[priority]?.inprogress || 0,
    completed: map[priority]?.completed || 0,
  }));
}


// ── sub-components ───────────────────────────────────────────────

function GaugeChart({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct = 100 - pct;

  // Fixed geometry
  const cx = 120, cy = 108, r = 88, sw = 14;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // stroke-dasharray on the same path as the track — progress always starts
  // from the left end and fills correctly regardless of arc direction.
  const totalLen = Math.PI * r;          // half-circumference
  const progressLen = (pct / 100) * totalLen;

  const color = pct >= 75 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <svg viewBox="0 0 240 125" className="w-full">
      {/* Grey track */}
      <path
        d={arcPath}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Coloured progress — same path, revealed via dasharray */}
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${progressLen} ${totalLen}`}
      />
      {/* Big percentage number */}
      <text
        x={cx}
        y={cy - 22}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: "38px", fontWeight: "800", fill: "#111827" }}
      >
        {pct}%
      </text>
      {/* Subtitle */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        style={{ fontSize: "9.5px", fill: "#9CA3AF" }}
      >
        {pct}% Complete / {pendingPct}% Pending
      </text>
    </svg>
  );
}

// Counts up from 0 → target with ease-out-cubic easing
function AnimatedNumber({ to, decimals = 0, duration = 1100 }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (to === 0) { setCurrent(0); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(eased * to);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{current.toFixed(decimals)}</>;
}

function EmptyState({ icon = "📋", message = "No data yet" }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-300">
      <span className="text-4xl mb-2">{icon}</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function StatCard({ icon, label, numeric = 0, decimals = 0, suffix = "", borderColor, emptyText }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100
        shadow-sm hover:shadow-md transition-shadow duration-200"
      style={{ borderTopColor: borderColor, borderTopWidth: "3px" }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: borderColor + "20" }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
          {label}
        </p>
        <p className="text-lg font-bold text-gray-800 leading-tight">
          {emptyText != null ? (
            <span className="text-gray-400 font-medium">{emptyText}</span>
          ) : (
            <>
              <AnimatedNumber to={numeric} decimals={decimals} />
              {suffix && (
                <span className="text-sm font-normal text-gray-500">{suffix}</span>
              )}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function MatrixTable({ rows }) {
  const cellStyle = (priority, status) => {
    if (status === "todo") {
      if (priority === "high") return "bg-red-100 text-red-700 font-semibold";
      if (priority === "medium") return "bg-amber-100 text-amber-700";
      return "bg-lime-100 text-lime-700";
    }
    if (status === "inprogress") {
      if (priority === "high") return "bg-orange-100 text-orange-700";
      if (priority === "medium") return "bg-yellow-100 text-yellow-700";
      return "bg-teal-100 text-teal-700";
    }
    return "bg-emerald-100 text-emerald-700";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="py-2 px-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide" />
            <th className="py-2 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              To Do
            </th>
            <th className="py-2 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              In Progress
            </th>
            <th className="py-2 px-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Completed
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ priority, todo, inprogress, completed }) => (
            <tr key={priority} className="border-t border-gray-100">
              <td className="py-2 px-3 font-medium capitalize text-gray-600 text-sm">
                {priority}
              </td>
              <td className="py-2 px-3 text-center">
                <span
                  className={`inline-block w-8 py-0.5 rounded text-center text-sm font-semibold ${cellStyle(priority, "todo")}`}
                >
                  {todo}
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                <span
                  className={`inline-block w-8 py-0.5 rounded text-center text-sm font-semibold ${cellStyle(priority, "inprogress")}`}
                >
                  {inprogress}
                </span>
              </td>
              <td className="py-2 px-3 text-center">
                <span
                  className={`inline-block w-8 py-0.5 rounded text-center text-sm font-semibold ${cellStyle(priority, "completed")}`}
                >
                  {completed}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeadlineCalendar({ deadlines }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const map = {};
  deadlines.forEach((d) => { map[d._id] = d.count; });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      day: d,
      count: map[key] || 0,
      isToday: d === today.getDate(),
      isPast: d < today.getDate(),
    });
  }

  const heatStyle = (count) => {
    if (count >= 5) return "bg-red-500 text-white";
    if (count >= 3) return "bg-orange-400 text-white";
    if (count >= 1) return "bg-amber-300 text-amber-900";
    return "bg-gray-50 text-gray-500";
  };

  const overdueHeatStyle = (count) => {
    if (count >= 1) return "bg-orange-600 text-white";
    return "bg-gray-100 text-gray-300";
  };

  const monthName = today.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <p className="text-xs text-center text-gray-400 mb-2 font-medium">
        {monthName}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-xs text-gray-300 font-medium py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`relative h-7 rounded flex items-center justify-center text-xs group cursor-default
              ${!cell ? "" : cell.isPast ? overdueHeatStyle(cell.count) : heatStyle(cell.count)}
              ${cell?.isToday ? "ring-2 ring-blue-500 font-bold" : ""}
            `}
          >
            {cell && (
              <>
                <span>{cell.day}</span>
                {/* Custom hover tooltip showing task count */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex
                  items-center bg-gray-800 text-white rounded px-1.5 py-0.5 whitespace-nowrap z-20
                  text-xs shadow-lg pointer-events-none">
                  {cell.count > 0
                    ? `${cell.count} task${cell.count > 1 ? "s" : ""} due`
                    : "No tasks"}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────

const CHART_COLORS = {
  todo: "#3B82F6",
  inprogress: "#F59E0B",
  completed: "#10B981",
  high: "#EF4444",
  medium: "#F59E0B",
  low: "#10B981",
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [waveDays, setWaveDays] = useState(30);

  const token = localStorage.getItem("accessToken");
  let userName = "User";
  try {
    if (token) userName = jwtDecode(token).name || "User";
  } catch (_) {}

  useEffect(() => {
    axios
      .get("/tasks/analytics")
      .then((res) => { setData(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-sm">Loading analytics…</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">Failed to load analytics.</p>
        </div>
      </>
    );
  }

  const {
    statusCounts,
    matrix,
    overdueCount,
    createdToday,
    avgLeadTime,
    dailyCreated,
    dailyCompleted,
    deadlines,
    ageDistribution = [],
  } = data;

  const total =
    statusCounts.todo + statusCounts.inprogress + statusCounts.completed;

  const matrixRows = buildMatrix(matrix);
  // Always build the full 30-day window; slice client-side per selection
  const dailyCreatedFull = buildDailyData(dailyCreated, 30);
  const dailyCompletedFull = buildDailyData(dailyCompleted, 30);
  const dailyCreatedData = dailyCreatedFull.slice(-waveDays);
  const dailyCompletedData = dailyCompletedFull.slice(-waveDays);

  // ── chart datasets ───────────────────────────────────────────

  const breakdownChartData = {
    labels: ["To Do", "In Progress", "Completed"],
    datasets: [
      {
        data: [
          statusCounts.todo,
          statusCounts.inprogress,
          statusCounts.completed,
        ],
        backgroundColor: [
          CHART_COLORS.todo,
          CHART_COLORS.inprogress,
          CHART_COLORS.completed,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Stacked bar: each priority × status
  const stackedPriorityData = {
    labels: ["High", "Medium", "Low"],
    datasets: [
      {
        label: "To Do",
        data: matrixRows.map((r) => r.todo),
        backgroundColor: CHART_COLORS.todo,
        borderRadius: 3,
      },
      {
        label: "In Progress",
        data: matrixRows.map((r) => r.inprogress),
        backgroundColor: CHART_COLORS.inprogress,
        borderRadius: 3,
      },
      {
        label: "Completed",
        data: matrixRows.map((r) => r.completed),
        backgroundColor: CHART_COLORS.completed,
        borderRadius: 3,
      },
    ],
  };

  const stackedPriorityOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 10, font: { size: 10 }, padding: 10 },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: "#F3F4F6" },
      },
    },
  };

  // Per-day completion rate for wave tooltip
  const dailyRateData = dailyCreatedData.map((d, i) =>
    d.count > 0 ? Math.round((dailyCompletedData[i].count / d.count) * 100) : null
  );

  // Combo chart: bars for Created, line for Completed
  const productivityChartData = {
    labels: dailyCreatedData.map((d) => d.label),
    datasets: [
      {
        type: "bar",
        label: "Created",
        data: dailyCreatedData.map((d) => d.count),
        backgroundColor: "rgba(59,130,246,0.75)",
        borderRadius: 3,
        order: 2,
      },
      {
        type: "line",
        label: "Completed",
        data: dailyCompletedData.map((d) => d.count),
        borderColor: "#F97316",
        backgroundColor: "transparent",
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#F97316",
        pointBorderColor: "#fff",
        pointBorderWidth: 1.5,
        borderWidth: 2.5,
        order: 1,
      },
    ],
  };

  // ── chart options ────────────────────────────────────────────

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = sum > 0 ? Math.round((val / sum) * 100) : 0;
            return ` ${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  const waveOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { boxWidth: 10, font: { size: 10 }, padding: 10 },
      },
      tooltip: {
        callbacks: {
          footer: (items) => {
            const idx = items[0]?.dataIndex;
            const rate = dailyRateData[idx];
            return rate !== null && rate !== undefined
              ? `Completion rate: ${rate}%`
              : "";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: "#F3F4F6" },
      },
      x: {
        ticks: { maxTicksLimit: 10, font: { size: 9 } },
        grid: { display: false },
      },
    },
  };

  // ── Task Age Distribution ─────────────────────────────────────
  const AGE_BUCKETS  = ["< 1 day", "1-7 days", "7-30 days", "30+ days"];
  const AGE_COLORS   = ["#10B981", "#F59E0B", "#F97316", "#EF4444"];

  const ageChartData = {
    labels: AGE_BUCKETS,
    datasets: [{
      label: "Open tasks",
      data: AGE_BUCKETS.map((b) => {
        const found = ageDistribution.find((d) => d.bucket === b);
        return found ? found.count : 0;
      }),
      backgroundColor: AGE_COLORS,
      borderRadius: 4,
    }],
  };

  const ageOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { size: 10 } },
        grid: { color: "#F3F4F6" },
      },
      y: { ticks: { font: { size: 10 } }, grid: { display: false } },
    },
  };

  const openTaskCount = statusCounts.todo + statusCounts.inprogress;

  // ── render ───────────────────────────────────────────────────

  return (
    <>
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            Welcome, {userName}!
            <span className="text-gray-400 font-normal ml-2 text-base">
              — Project Overview
            </span>
          </h2>
        </div>

        {/* ROW 1 — Task Breakdown | Project Health | Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

          {/* Task Breakdown */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#3B82F6", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Task Breakdown
            </h3>
            {total === 0 ? (
              <EmptyState icon="📋" message="No tasks yet" />
            ) : (
              <>
                <div className="flex justify-center">
                  <div className="relative" style={{ width: 160, height: 160 }}>
                    <Doughnut data={breakdownChartData} options={donutOptions} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-800">{total}</span>
                      <span className="text-xs text-gray-400">total tasks</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-4 mt-3 flex-wrap">
                  {[
                    { label: "To Do", key: "todo", count: statusCounts.todo },
                    { label: "In Progress", key: "inprogress", count: statusCounts.inprogress },
                    { label: "Completed", key: "completed", count: statusCounts.completed },
                  ].map(({ label, key, count }) => (
                    <span key={key} className="flex items-center gap-1 text-xs text-gray-500">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: CHART_COLORS[key] }}
                      />
                      {label} ({count})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Project Health */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#10B981", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Project Health
            </h3>
            <GaugeChart completed={statusCounts.completed} total={total} />
          </div>

          {/* Stat Cards */}
          <div className="flex flex-col gap-3 justify-center">
            <StatCard
              icon="⏰"
              label="Overdue"
              numeric={overdueCount}
              borderColor="#EF4444"
            />
            <StatCard
              icon="📅"
              label="Created Today"
              numeric={createdToday}
              borderColor="#3B82F6"
            />
            <StatCard
              icon="⏱"
              label="Avg. Lead Time"
              numeric={avgLeadTime ?? 0}
              decimals={1}
              suffix=" days"
              borderColor="#10B981"
              emptyText={avgLeadTime == null ? "N/A" : null}
            />
          </div>
        </div>

        {/* ROW 2 — Priority Distribution | Task Age Distribution | Status × Priority Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">

          {/* Priority Distribution — stacked bar */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#F59E0B", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Priority Distribution
            </h3>
            <p className="text-xs text-gray-300 mb-3">Tasks by priority × status</p>
            {total === 0 ? (
              <EmptyState icon="🏷️" message="No tasks with priority set" />
            ) : (
              <div style={{ height: 170 }}>
                <MixedChart type="bar" data={stackedPriorityData} options={stackedPriorityOptions} />
              </div>
            )}
          </div>

          {/* Task Age Distribution */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#F97316", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Task Age Distribution
            </h3>
            <p className="text-xs text-gray-300 mb-3">Open tasks by age</p>
            {openTaskCount === 0 ? (
              <EmptyState icon="🕐" message="No open tasks" />
            ) : (
              <div style={{ height: 170 }}>
                <MixedChart type="bar" data={ageChartData} options={ageOptions} />
              </div>
            )}
          </div>

          {/* Status × Priority Matrix */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#8B5CF6", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Status × Priority Matrix
            </h3>
            <MatrixTable rows={matrixRows} />
          </div>
        </div>

        {/* ROW 3 — Productivity Wave (2/3) | Deadline Calendar (1/3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Productivity Wave */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:col-span-2
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#3B82F6", borderTopWidth: "3px" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Productivity Wave
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  Bars = Created &nbsp;·&nbsp; Line = Completed
                </p>
              </div>
              {/* Period selector */}
              <div className="flex gap-1 flex-shrink-0">
                {[
                  { days: 7,  label: "7d" },
                  { days: 15, label: "15d" },
                  { days: 30, label: "30d" },
                ].map(({ days, label }) => (
                  <button
                    key={days}
                    onClick={() => setWaveDays(days)}
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-medium transition-colors ${
                      waveDays === days
                        ? "bg-blue-500 text-white border-blue-500"
                        : "text-gray-400 border-gray-200 hover:border-blue-300 hover:text-blue-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 200 }}>
              <MixedChart
                type="bar"
                data={productivityChartData}
                options={waveOptions}
              />
            </div>
          </div>

          {/* Deadline Calendar */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5
              hover:shadow-md transition-shadow duration-200"
            style={{ borderTopColor: "#EF4444", borderTopWidth: "3px" }}
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Deadline Calendar
            </h3>
            <DeadlineCalendar deadlines={deadlines} />
            <div className="flex items-center gap-3 mt-3 flex-wrap text-xs text-gray-400">
              <span className="text-gray-500 font-medium">Upcoming:</span>
              {[
                { color: "bg-amber-300", label: "1-2" },
                { color: "bg-orange-400", label: "3-4" },
                { color: "bg-red-500", label: "5+" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`w-2.5 h-2.5 rounded-sm inline-block ${color}`} />
                  {label}
                </span>
              ))}
              <span className="text-gray-500 font-medium ml-1">Overdue:</span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-orange-600" />
                has tasks
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
