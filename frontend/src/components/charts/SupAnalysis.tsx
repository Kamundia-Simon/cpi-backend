import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Users } from "lucide-react";
import type { SupplierSpendRow } from "../../types";

interface Props {
  data: SupplierSpendRow[];
}

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
const FALLBACK_COLORS = ["#6b7280", "#d1d5db"];

const SupplierAnalytics = ({ data }: Props) => {
  const suppliers = useMemo(
    () => Array.from(new Set(data.map((d) => d.supplier))).sort(),
    [data],
  );

  // Pivot rows into { month, Fulcrum: x, PureSpectrum: y, ... }
  const barData = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    const monthOrder: string[] = [];

    data.forEach(({ month, supplier, spend }) => {
      if (!monthMap[month]) {
        monthMap[month] = {};
        monthOrder.push(month);
      }
      monthMap[month][supplier] = (monthMap[month][supplier] || 0) + spend;
    });

    const sorted = [...monthOrder].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    return sorted.slice(-5).map((month) => ({ month, ...monthMap[month] }));
  }, [data]);

  // Aggregate completes per supplier across all months
  const donutData = useMemo(() => {
    const totals: Record<string, number> = {};
    data.forEach(({ supplier, completes }) => {
      totals[supplier] = (totals[supplier] || 0) + completes;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const totalCompletes = donutData.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Stacked bar — spend per month */}
      <div
        className="col-span-3 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-5"
        style={{ height: "420px" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-50 rounded-md">
            <TrendingUp size={14} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">
            Spend per Month by Supplier
          </h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              barCategoryGap="25%"
              barGap={3}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 15, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `£${v}`}
                tick={{ fontSize: 15, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  `£${(value as number).toFixed(2)}`,
                  name,
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px" }}
              />
              {suppliers.map((supplier, i) => (
                <Bar
                  key={supplier}
                  dataKey={supplier}
                  fill={
                    SUPPLIER_COLORS[supplier] ??
                    FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  }
                  radius={[3, 3, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut — completes per supplier */}
      <div
        className="col-span-2 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 p-5"
        style={{ height: "420px" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-blue-50 rounded-md">
            <Users size={14} className="text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700">
            Completes by Supplier
          </h3>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
              >
                {donutData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      SUPPLIER_COLORS[entry.name] ??
                      FALLBACK_COLORS[i % FALLBACK_COLORS.length]
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
                  `${value} (${((value / totalCompletes) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SupplierAnalytics;
