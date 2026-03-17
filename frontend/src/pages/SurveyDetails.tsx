import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  PoundSterling,
  Users,
  Download,
} from "lucide-react";
import { getSurveyPoints } from "../api";
import SummaryTile from "../components/tiles/SummaryTile";

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
  const [cpiMin, setCpiMin] = useState<string>("0");
  const [cpiMax, setCpiMax] = useState<string>("");

  //Fulcrum markup formula.

  const computeDisplayCPI = (p: Point): number => {
    if (p.supplier === "Fulcrum") {
      return (p.cpi / 100 + 0.17) * 1.05;
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
  }, [points, selectedSupplier, selectedSubSupplier, cpiMin, cpiMax]);

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
    <div className="p-6">
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-end gap-4">
          {/* Supplier Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier === "All" ? "All Suppliers" : supplier}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-supplier Filter (Fulcrum only) */}
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

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSelectedSupplier("All");
              setSelectedSubSupplier("All");
              setCpiMin("0");
              setCpiMax("");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-semibold transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          {filteredAndSorted.length} record{filteredAndSorted.length !== 1 ? "s" : ""} match current filters
        </p>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>
    </div>
  );
};

export default SurveyDetail;
