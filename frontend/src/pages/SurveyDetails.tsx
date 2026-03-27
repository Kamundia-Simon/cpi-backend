import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PoundSterling,
  Users,
  Download,
  TrendingUp,
} from "lucide-react";
import { getSurveyPoints } from "../api";
import SummaryTile from "../components/tiles/SummaryTile";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Point {
  pid: string;
  cpi: number;
  supplier: string;
  stime: string;
  suppname?: string | null;
}

const SurveyDetail = () => {
  const navigate = useNavigate();
  const { surveyName } = useParams<{ surveyName: string }>();

  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSurveyPoints(surveyName ?? "");
        setPoints(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [surveyName]);

  // Filter and sort state
  const [selectedSupplier, setSelectedSupplier] = useState<string>("All");
  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [cpiMin, setCpiMin] = useState<string>("0");
  const [cpiMax, setCpiMax] = useState<string>("");

  //Fulcrum markup formula.

  const computeDisplayCPI = (p: Point): number => {
    if (p.supplier === "Fulcrum") {
      return (p.cpi / 100 + 0.17) * 1.0585;
    }
    return p.cpi / 100;
  };
  const downloadCSV = () => {
    const headers = [
      "PID",
      "CPI (Adj.)",
      "Raw CPI",
      "Supplier",
      "Sub-supplier",
      "Timestamp",
    ];
    const rows = filteredAndSorted.map((p) => [
      p.pid,
      computeDisplayCPI(p).toFixed(2),
      (p.cpi / 100).toFixed(2),
      p.supplier,
      p.suppname ?? "",
      p.stime,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${surveyName ?? "survey"}_points.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const [selectedSubSupplier, setSelectedSubSupplier] = useState<string>("All");

  // Sub-supplier options (only from Fulcrum points with a non-empty suppname)
  const uniqueSubSuppliers = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          points
            .filter((p) => p.supplier === "Fulcrum" && p.suppname)
            .map((p) => p.suppname as string),
        ),
      ).sort(),
    ],
    [points],
  );

  const hasFulcrumSubSuppliers = uniqueSubSuppliers.length > 1;

  const uniqueMonths = useMemo(() => {
    const keys = Array.from(
      new Set(
        points.map((p) => {
          const d = new Date(p.stime);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        }),
      ),
    ).sort();
    return ["All", ...keys];
  }, [points]);

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
      "en-GB",
      { month: "short", year: "numeric" },
    );
  };

  // Get unique suppliers
  const uniqueSuppliers = useMemo(
    () => [
      "All",
      ...Array.from(new Set(points.map((p) => p.supplier.toString()))).sort(),
    ],
    [points],
  );

  // Filter and sort points
  const filteredAndSorted = useMemo(() => {
    let result = [...points];

    // Supplier filter
    if (selectedSupplier !== "All") {
      result = result.filter((p) => p.supplier.toString() === selectedSupplier);
    }

    //Fulcrum sub-supplier filter
    if (hasFulcrumSubSuppliers && selectedSubSupplier !== "All") {
      result = result.filter(
        (p) => p.supplier === "Fulcrum" && p.suppname === selectedSubSupplier,
      );
    }

    // Month filter
    if (selectedMonth !== "All") {
      result = result.filter((p) => {
        const d = new Date(p.stime);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonth;
      });
    }

    // CPI range filter (convert pounds to pence)
    if (cpiMin) {
      const min = parseFloat(cpiMin) * 100;
      result = result.filter((p) => p.cpi >= min);
    }
    if (cpiMax) {
      const max = parseFloat(cpiMax) * 100;
      result = result.filter((p) => p.cpi <= max);
    }

    return result;
  }, [
    points,
    selectedSupplier,
    selectedSubSupplier,
    selectedMonth,
    cpiMin,
    cpiMax,
  ]);

  // Calculate metrics
  const totalCPI = useMemo(
    () => filteredAndSorted.reduce((sum, p) => sum + computeDisplayCPI(p), 0),
    [filteredAndSorted],
  );
  const totalCompletes = filteredAndSorted.length;
  const averageCPI = useMemo(
    () =>
      totalCompletes > 0 ? (totalCPI / totalCompletes).toFixed(2) : "0.00",
    [totalCPI, totalCompletes],
  );
  const cpiTrend = useMemo(() => {
    if (filteredAndSorted.length === 0) return [];

    const timestamps = filteredAndSorted.map((p) =>
      new Date(p.stime).getTime(),
    );
    const minTs = Math.min(...timestamps);
    const maxTs = Math.max(...timestamps);
    const totalDays = (maxTs - minTs) / 86_400_000;

    const getBucketKey = (d: Date): string => {
      if (totalDays <= 14) {
        return d.toISOString().slice(0, 10);
      } else if (totalDays <= 60) {
        const day = d.getDay() || 7;
        const t = new Date(d);
        t.setDate(t.getDate() + 4 - day);
        const year = t.getFullYear();
        const week = Math.ceil(
          ((t.getTime() - new Date(year, 0, 1).getTime()) / 86_400_000 + 1) / 7,
        );
        return `${year}-W${String(week).padStart(2, "0")}`;
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    };

    const formatLabel = (key: string): string => {
      if (totalDays <= 14) {
        return new Date(key + "T12:00:00").toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
      } else if (totalDays <= 60) {
        const [year, week] = key.split("-W");
        const jan1 = new Date(parseInt(year), 0, 1);
        const wc = new Date(
          jan1.getTime() + (parseInt(week) - 1) * 7 * 86_400_000,
        );
        return `w/c ${wc.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`;
      }
      const [year, month] = key.split("-");
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(
        "en-GB",
        {
          month: "short",
          year: "numeric",
        },
      );
    };

    const buckets: Record<string, { totalCPI: number; count: number }> = {};
    filteredAndSorted.forEach((p) => {
      const key = getBucketKey(new Date(p.stime));
      if (!buckets[key]) buckets[key] = { totalCPI: 0, count: 0 };
      buckets[key].totalCPI += computeDisplayCPI(p);
      buckets[key].count += 1;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { totalCPI, count }]) => ({
        label: formatLabel(key),
        avgCPI: parseFloat((totalCPI / count).toFixed(2)),
        completes: count,
      }));
  }, [filteredAndSorted]);

  const SUPPLIER_COLORS: Record<string, string> = {
    Fulcrum: "#ef4444",
    PureSpectrum: "#3b82f6",
    ClientSample: "#f97316",
    Cint: "#10b981",
    Nebu: "#8b5cf6",
    Dynata: "#06b6d4",
    Toluna: "#84cc16",
    DataSpring: "#f59e0b",
    Borderless: "#ec4899",
  };
  const DONUT_FALLBACK = [
    "#10b981",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f59e0b",
  ];

  const supplierShare = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAndSorted.forEach((p) => {
      counts[p.supplier] = (counts[p.supplier] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredAndSorted]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-lg">Loading survey details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Survey: {surveyName}</h1>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryTile
          title="Total on Project"
          value={`£${totalCPI.toFixed(2)}`}
          icon={PoundSterling}
        />
        <SummaryTile
          title="Average"
          value={`£${parseFloat(averageCPI).toFixed(2)}`}
          icon={PoundSterling}
        />
        <SummaryTile
          title="Number of Completes"
          value={totalCompletes.toString()}
          icon={Users}
        />
      </div>

      {/* Filters + Export — unified card */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-end gap-4 mb-4">
          {/* Supplier */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueSuppliers.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Suppliers" : s}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-supplier (Fulcrum only) */}
          {hasFulcrumSubSuppliers && (
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sub-supplier
              </label>
              <select
                value={selectedSubSupplier}
                onChange={(e) => setSelectedSubSupplier(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueSubSuppliers.map((s) => (
                  <option key={s} value={s}>
                    {s === "All" ? "All Sub-suppliers" : s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {m === "All" ? "All Months" : formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* CPI Min */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              CPI Min
            </label>
            <input
              type="number"
              placeholder="Min CPI"
              step="0.05"
              value={cpiMin}
              onChange={(e) => setCpiMin(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CPI Max */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              CPI Max
            </label>
            <input
              type="number"
              placeholder="Max CPI"
              step="0.05"
              value={cpiMax}
              onChange={(e) => setCpiMax(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer: record count + actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {filteredAndSorted.length} record
            {filteredAndSorted.length !== 1 ? "s" : ""} match current filters
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedSupplier("All");
                setSelectedSubSupplier("All");
                setSelectedMonth("All");
                setCpiMin("0");
                setCpiMax("");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-semibold transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      {filteredAndSorted.length > 0 && (
        <div className="flex-1 min-h-0 grid grid-cols-5 gap-6">
          {/* CPI Trend */}
          {cpiTrend.length > 1 && (
            <div className="col-span-3 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <TrendingUp size={14} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Avg CPI Over Fieldwork
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={cpiTrend}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="cpiGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `£${v}`}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `£${value.toFixed(2)}`,
                        "Avg CPI",
                      ]}
                      cursor={{
                        stroke: "#3b82f6",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgCPI"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#cpiGradient)"
                      dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{
                        r: 5,
                        fill: "#3b82f6",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Supplier Share */}
          {supplierShare.length > 0 && (
            <div className="col-span-2 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <Users size={14} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">
                  Supplier Share
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={supplierShare}
                      cx="50%"
                      cy="42%"
                      innerRadius={80}
                      outerRadius={130}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {supplierShare.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            SUPPLIER_COLORS[entry.name] ??
                            DONUT_FALLBACK[i % DONUT_FALLBACK.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "14px",
                        padding: "8px 12px",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} (${((value / filteredAndSorted.length) * 100).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: "20px", paddingTop: "20px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SurveyDetail;
