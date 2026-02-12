import { useState, useMemo, useEffect } from "react";
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
import { getSurveys, getPMs } from "../api";

// Helpers
const parseDate = (val: string): Date => new Date(val);
const extractMonth = (val: string): string => {
  const dt = new Date(val);
  return dt.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
};

// Sortable column keys for the dashboard table
type SortColumn = "surveyName" | "totalPaid" | "totalCompletes" | "startDate";

const Dashboard = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [pms, setPms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [surveysData, pmsData] = await Promise.all([
          getSurveys(),
          getPMs(),
        ]);
        setSurveys(surveysData);
        setPms(pmsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sort and filter state
  const [sortBy, setSortBy] = useState<SortColumn | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pmFilter, setPmFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("All");
  const [startDateFrom, setStartDateFrom] = useState<string>("");
  const [startDateTo, setStartDateTo] = useState<string>("");

  const uniqueMonths = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(surveys.map((s) => extractMonth(s.startDate))),
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    ],
    [surveys],
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
    let result = [...surveys];

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
      result = result.filter((s) => extractMonth(s.startDate) === monthFilter);
    }

    // Date range filter
    if (startDateFrom) {
      const from = new Date(startDateFrom).getTime();
      result = result.filter((s) => parseDate(s.startDate).getTime() >= from);
    }
    if (startDateTo) {
      const to = new Date(startDateTo).getTime();
      result = result.filter((s) => parseDate(s.startDate).getTime() <= to);
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
            cmp = a.totalPaid - b.totalPaid;
            break;
          case "totalCompletes":
            cmp = a.totalCompletes - b.totalCompletes;
            break;
          case "startDate":
            cmp =
              parseDate(a.startDate).getTime() -
              parseDate(b.startDate).getTime();
            break;
        }
        return sortOrder === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [
    surveys,
    sortBy,
    sortOrder,
    pmFilter,
    searchQuery,
    monthFilter,
    startDateFrom,
    startDateTo,
  ]);

  //Dynamic summarry metrics calcs
  const summaryMetrics = useMemo(() => {
    const totalPaid = filteredAndSorted.reduce(
      (sum, s) => sum + s.totalPaid,
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-lg">Loading dashboard...</p>
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
        <Link
          to="/"
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Back to Home"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">CPI Dashboard</h1>
      </div>

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
      <h2 className="text-lg font-bold mb-4">Project Managers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {pms.map((pm) => {
          const pmSurveys = surveys.filter((s) => s.pm === pm.name);
          const pmTotal = pmSurveys.reduce((sum, s) => sum + s.totalPaid, 0);
          return (
            <PMTile
              key={pm.id}
              id={pm.id}
              name={pm.name}
              totalProjects={pmSurveys.length.toString()}
              totalAmount={`£${pmTotal.toFixed(2)}`}
            />
          );
        })}
      </div>

      {/* All Surveys Table*/}
      <h2 className="text-lg font-bold mb-4">All Surveys</h2>
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-end gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">
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
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={startDateTo}
              onChange={(e) => setStartDateTo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* PM Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Project Manager
            </label>
            <select
              value={pmFilter}
              onChange={(e) => setPmFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Filter by Project Manager</option>
              {pms.map((pm) => (
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
              setStartDateFrom("");
              setStartDateTo("");
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-semibold transition-colors"
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
