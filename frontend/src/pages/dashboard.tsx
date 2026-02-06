import { useState, useMemo } from "react";
import SummaryTile from "../components/tiles/SummaryTile";
import PMTile from "../components/tiles/PMTile";
import { SurveysTable } from "../components/tables/SurveysTable";
import {
  PoundSterling,
  Calculator,
  FolderKanban,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PMs,
  allSurveys,
  pmStats,
  parsePounds,
  parseMonth,
} from "../data/mockData";

// Sortable column keys for the dashboard table
type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startMonth";

const Dashboard = () => {
  // Sort and filter state
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pmFilter, setPmFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("All");

  const uniqueMonths = useMemo(
    () => [
      "All",
      ...Array.from(new Set(allSurveys.map((s) => s.startMonth))).sort(),
    ],
    [],
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

  // Filter and sort surveys
  const filteredAndSorted = useMemo(() => {
    let result = [...allSurveys];

    // PM filter
    if (pmFilter !== "All") {
      result = result.filter((s) => s.pm === pmFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter((s) =>
        s.surveyName.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Month filter
    if (monthFilter !== "All") {
      result = result.filter((s) => s.startMonth === monthFilter);
    }

    // Sort
    if (sortBy) {
      result.sort((a, b) => {
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
          case "startMonth":
            cmp =
              parseMonth(a.startMonth).getTime() -
              parseMonth(b.startMonth).getTime();
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [sortBy, sortOrder, pmFilter, searchQuery, monthFilter]);

  //Dynamic summarry metrics calcs
  const summaryMetrics = useMemo(() => {
    const totalPaid = filteredAndSorted.reduce(
      (sum, s) => sum + parsePounds(s.totalPaid),
      0,
    );
    const totalProjects = filteredAndSorted.length;
    const avgPerProject = totalProjects > 0 ? totalPaid / totalProjects : 0;

    return {
      totalAmount: `£${totalPaid.toFixed(2)}`,
      avgPerProject: `£${avgPerProject.toFixed(2)}`,
      totalProjects: totalProjects.toString(),
    };
  }, [filteredAndSorted]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Back to Home"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">CPI Dashboard</h1>
      </div>

      {/* Summary Tiles */}
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

      {/* PM Tiles */}
      <h2 className="text-lg font-semibold mb-4">Project Managers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {PMs.map((pm) => (
          <PMTile
            key={pm.id}
            id={pm.id}
            name={pm.name}
            totalProjects={pmStats[pm.id].totalProjects}
            totalAmount={pmStats[pm.id].totalAmount}
          />
        ))}
      </div>

      {/* All Surveys Table*/}
      <h2 className="text-lg font-semibold mb-4">All Surveys</h2>
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
              Start Month
            </label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueMonths.map((month) => (
                <option key={month} value={month}>
                  {month === "All" ? "Start Month" : month}
                </option>
              ))}
            </select>
          </div>
          {/* PM Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Manager
            </label>
            <select
              value={pmFilter}
              onChange={(e) => setPmFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Filter by Project Manager</option>
              {PMs.map((pm) => (
                <option key={pm.id} value={pm.name}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>
          {/* Clear Filters Button */}
          <button
            onClick={() => {
              setSearchQuery("");
              setMonthFilter("All");
              setPmFilter("All");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
      <SurveysTable
        surveys={filteredAndSorted}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        renderSortIcon={renderSortIcon}
      />
    </div>
  );
};

export default Dashboard;
