import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { PMProjectsTable } from "../components/tables/PMProjectsTable";
import {
  PoundSterling,
  Calculator,
  FolderKanban,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import SummaryTile from "../components/tiles/SummaryTile";
import type { PMId } from "../types";
import { pmNames, pmProjects, parsePounds, parseDate, extractMonth } from "../data/mockData";

// Sortable column keys for the PM table
type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startDate";

const PMDetail = () => {
  const navigate = useNavigate();
  const { pmId } = useParams<{ pmId: string }>();
  const pmIdNum = Number(pmId) as PMId;
  const pmName = pmNames[pmIdNum] ?? "Unknown";
  const projects = pmProjects[pmIdNum] ?? [];

  // Sort and filter state
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("All");
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");

  // Get unique months for filters
  const uniqueMonths = useMemo(
    () => [
      "All",
      ...Array.from(new Set(projects.map((p) => extractMonth(p.startDate)))).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      ),
    ],
    [projects],
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

  // Sort projects
  const sorted = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.surveyName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Month filter
    if (monthFilter !== "All") {
      result = result.filter((p) => extractMonth(p.startDate) === monthFilter);
    }

    // Date range filter
    if (startDateFrom) {
      const from = new Date(startDateFrom).getTime();
      result = result.filter((p) => parseDate(p.startDate).getTime() >= from);
    }
    if (startDateTo) {
      const to = new Date(startDateTo).getTime();
      result = result.filter((p) => parseDate(p.startDate).getTime() <= to);
    }

    // Sort
    if (!sortBy) return result;

    return result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "surveyName":
          cmp = a.surveyName.localeCompare(b.surveyName);
          break;
        case "totalPaid":
          cmp = parsePounds(a.totalPaid) - parsePounds(b.totalPaid);
          break;
        case "totalCompletes":
          cmp = a.totalCompletes - b.totalCompletes;
          break;
        case "startDate":
          cmp =
            parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime();
          break;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [projects, sortBy, sortOrder, searchQuery, monthFilter, startDateFrom, startDateTo]);

  // Dynamic summary calcs based on filters
  const summaryMetrics = useMemo(() => {
    const totalPaid = sorted.reduce(
      (sum, p) => sum + parsePounds(p.totalPaid),
      0,
    );
    const totalProjects = sorted.length;
    const avgPerProject = totalProjects > 0 ? totalPaid / totalProjects : 0;

    return {
      totalAmount: `£${totalPaid.toFixed(2)}`,
      avgPerProject: `£${avgPerProject.toFixed(2)}`,
      totalProjects: totalProjects.toString(),
    };
  }, [sorted]);

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
        <h1 className="text-2xl font-bold">PM: {pmName}</h1>
      </div>

      {/* PM Summary Tiles*/}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <SummaryTile
          title="Total Amount"
          value={summaryMetrics.totalAmount}
          icon={PoundSterling}
        />
        <SummaryTile
          title="Average per Project"
          value={summaryMetrics.avgPerProject}
          icon={Calculator}
        />
        <SummaryTile
          title="Total Projects"
          value={summaryMetrics.totalProjects}
          icon={FolderKanban}
        />
      </div>

      <h2 className="text-lg font-semibold mb-4">Surveys</h2>
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Name
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Month Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {month === "All" ? "All Months" : month}
                </option>
              ))}
            </select>
          </div>
          {/* Date Range - From */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDateFrom}
              onChange={(e) => setStartDateFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Date Range - To */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={startDateTo}
              onChange={(e) => setStartDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setMonthFilter("All");
              setStartDateFrom("");
              setStartDateTo("");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      <PMProjectsTable
        projects={sorted}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        renderSortIcon={renderSortIcon}
      />
    </div>
  );
};

export default PMDetail;
