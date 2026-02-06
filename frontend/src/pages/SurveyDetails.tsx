import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import { surveyPoints } from "../data/mockData";
import { SurveyPointsTable } from "../components/tables/SurveyPointsTable";
import SummaryTile from "../components/tiles/SummaryTile";
import { PoundSterling, Users } from "lucide-react";

interface Point {
  pid: string;
  cpi: number;
  supplier: number;
  stime: string;
}

type SortColumn = "cpi" | "supplier" | "stime";

const SurveyDetail = () => {
  const navigate = useNavigate();
  const { surveyName } = useParams<{ surveyName: string }>();

  // Hardcoded placeholder
  const points: Point[] = surveyPoints[surveyName ?? ""] ?? [];

  // Filter and sort state
  const [selectedSupplier, setSelectedSupplier] = useState<string>("All");
  const [cpiMin, setCpiMin] = useState<string>("0");
  const [cpiMax, setCpiMax] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Get unique suppliers
  const uniqueSuppliers = useMemo(
    () => [
      "All",
      ...Array.from(new Set(points.map((p) => p.supplier.toString()))).sort(),
    ],
    [points],
  );

  // Toggle sort direction or set new column
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Render chevron icon
  const renderSortIcon = (column: SortColumn) => {
    if (sortBy !== column) {
      return <ChevronUp size={14} className="text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    );
  };

  // Filter and sort points
  const filteredAndSorted = useMemo(() => {
    let result = [...points];

    // Supplier filter
    if (selectedSupplier !== "All") {
      result = result.filter((p) => p.supplier.toString() === selectedSupplier);
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

    // Sorting
    if (sortBy) {
      result.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case "cpi":
            cmp = a.cpi - b.cpi;
            break;
          case "supplier":
            cmp = a.supplier - b.supplier;
            break;
          case "stime":
            cmp = new Date(a.stime).getTime() - new Date(b.stime).getTime();
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [points, selectedSupplier, cpiMin, cpiMax, sortBy, sortOrder]);

  // Calculate metrics
  const totalCPI = useMemo(
    () => filteredAndSorted.reduce((sum, p) => sum + p.cpi, 0),
    [filteredAndSorted],
  );
  const totalCompletes = filteredAndSorted.length;
  const averageCPI = useMemo(
    () =>
      totalCompletes > 0 ? (totalCPI / totalCompletes).toFixed(2) : "0.00",
    [totalCPI, totalCompletes],
  );

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

      {/* Summary Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryTile
          title="Total on Project"
          value={`£${(totalCPI / 100).toFixed(2)}`}
          icon={PoundSterling}
        />
        <SummaryTile
          title="Average"
          value={`£${(parseFloat(averageCPI) / 100).toFixed(2)}`}
          icon={PoundSterling}
        />
        <SummaryTile
          title="Number of Completes"
          value={totalCompletes.toString()}
          icon={Users}
        />
      </div>

      <h2 className="text-lg font-semibold mb-4">Point Records</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-end gap-4">
          {/* Supplier Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier === "All"
                    ? "All Suppliers"
                    : `Supplier ${supplier}`}
                </option>
              ))}
            </select>
          </div>

          {/* CPI Min */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPI Min
            </label>
            <input
              type="number"
              placeholder="Min CPI"
              value={cpiMin}
              onChange={(e) => setCpiMin(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* CPI Max */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPI Max
            </label>
            <input
              type="number"
              placeholder="Max CPI"
              value={cpiMax}
              onChange={(e) => setCpiMax(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSelectedSupplier("All");
              setCpiMin("0");
              setCpiMax("");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <SurveyPointsTable
        points={filteredAndSorted}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        renderSortIcon={renderSortIcon}
      />
    </div>
  );
};

export default SurveyDetail;
