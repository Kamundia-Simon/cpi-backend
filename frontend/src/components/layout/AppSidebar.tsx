import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FolderOpen, ChevronDown } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";
import { ROUTES } from "../../constants/routes";
import { getPMs, getSurveys } from "../../api";

interface PM {
  id: number;
  name: string;
}

interface Survey {
  surveyName: string;
  startDate: string; // "dd MMM YYYY HH:MM"
}

/** Parse "dd MMM YYYY HH:MM" → "MMM YYYY" label and sortable "YYYY-MM" key */
function parseSurveyMonth(startDate: string): { key: string; label: string } {
  const parts = startDate.split(" "); // ["03", "Jan", "2026", "09:15"]
  const month = parts[1] ?? "";
  const year = parts[2] ?? "";
  const monthIndex = new Date(`${month} 1 ${year}`).getMonth(); // 0-based
  const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return { key, label: `${month} ${year}` };
}

export const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } =
    useSidebar();
  const location = useLocation();

  const [pms, setPMs] = useState<PM[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  // Both submenus collapsed by default — auto-open only when on their routes
  const [pmSubmenuOpen, setPmSubmenuOpen] = useState(false);
  const [surveySubmenuOpen, setSurveySubmenuOpen] = useState(false);
  const [surveySubmenuMounted, setSurveySubmenuMounted] = useState(false);
  const [monthExpanded, setMonthExpanded] = useState<string>(""); // which month's survey list is open

  // Fetch PMs
  useEffect(() => {
    getPMs()
      .then((data: PM[]) => setPMs(data))
      .catch(() => setPMs([]));
  }, []);

  // Fetch surveys
  useEffect(() => {
    getSurveys()
      .then((data: Survey[]) => setSurveys(data))
      .catch(() => setSurveys([]));
  }, []);

  // Derive sorted unique months from survey data
  const availableMonths = useMemo(() => {
    const seen = new Set<string>();
    const months: { key: string; label: string }[] = [];
    for (const s of surveys) {
      const { key, label } = parseSurveyMonth(s.startDate);
      if (!seen.has(key)) {
        seen.add(key);
        months.push({ key, label });
      }
    }
    // Sort descending (most recent first)
    return months.sort((a, b) => b.key.localeCompare(a.key));
  }, [surveys]);


  // Auto-open submenus when navigating to their routes.
  // For surveys: also pre-select the correct month, but keep collapsed until user clicks.
  // We use surveySubmenuMounted to avoid opening on the very first render.
  useEffect(() => {
    if (location.pathname.startsWith("/pm")) {
      setPmSubmenuOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!location.pathname.startsWith("/survey")) return;
    // Pre-select the month and expand that month's list for the active survey
    if (surveys.length > 0) {
      const activeSurvey = surveys.find(
        (s) => ROUTES.SURVEY_DETAIL(s.surveyName) === location.pathname
      );
      if (activeSurvey) {
        const { key } = parseSurveyMonth(activeSurvey.startDate);
        setMonthExpanded(key); // auto-expand the month containing this survey
      }
    }
    // Only auto-open the submenu on subsequent navigations, not on initial page load
    if (surveySubmenuMounted) {
      setSurveySubmenuOpen(true);
    } else {
      setSurveySubmenuMounted(true);
    }
  }, [location.pathname, surveys, surveySubmenuMounted]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) toggleMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isVisible = isExpanded || isHovered || isMobileOpen;

  const isDashboardActive = location.pathname === "/dashboard";
  const isPmSectionActive = location.pathname.startsWith("/pm");
  const isSurveySectionActive = location.pathname.startsWith("/survey");

  return (
    <aside
      className={[
        "fixed left-0 top-0 h-screen z-[99999]",
        "bg-white border-r border-gray-200",
        "flex flex-col",
        "transition-all duration-300 ease-in-out",
        isExpanded || isHovered ? "lg:w-[290px]" : "lg:w-[90px]",
        isMobileOpen ? "translate-x-0 w-[290px]" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div
        className={[
          "flex items-center border-b border-gray-200 h-16 px-5 shrink-0",
          isVisible ? "justify-start gap-2" : "lg:justify-center",
        ].join(" ")}
      >
        <Link to="/" title="Home" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#FFD700] text-black">
            <span className="text-lg font-bold leading-none">3</span>
          </div>
          {isVisible && (
            <span className="text-xl whitespace-nowrap overflow-hidden">
              <span className="font-semibold">GEM</span>
              <span className="font-normal text-gray-600"> CPI Tracker</span>
            </span>
          )}
        </Link>
      </div>

      {/* ── Navigation ───────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">

        {/* ── MENU group ──────────────────────────────────────── */}
        <div className="mb-6">
          <GroupLabel isVisible={isVisible} label="Menu" />
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                to={ROUTES.DASHBOARD}
                title={!isVisible ? "Dashboard" : undefined}
                className={navItemClass(isDashboardActive, isVisible)}
              >
                <LayoutDashboard size={20} className={iconClass(isDashboardActive)} />
                {isVisible && <span className="whitespace-nowrap">Dashboard</span>}
              </Link>
            </li>
          </ul>
        </div>

        {/* ── PROJECTS group ───────────────────────────────────── */}
        <div className="mb-6">
          <GroupLabel isVisible={isVisible} label="Projects" />
          <ul className="flex flex-col gap-1">
            <li>
              {/* Surveys accordion trigger */}
              <button
                onClick={() => isVisible && setSurveySubmenuOpen((prev) => !prev)}
                title={!isVisible ? "Surveys" : undefined}
                className={navItemClass(isSurveySectionActive, isVisible, true)}
              >
                <FolderOpen size={20} className={iconClass(isSurveySectionActive)} />
                {isVisible && (
                  <>
                    <span className="flex-1 whitespace-nowrap text-left">Surveys</span>
                    <ChevronDown
                      size={16}
                      className={[
                        "shrink-0 transition-transform duration-200",
                        surveySubmenuOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </>
                )}
              </button>

              {isVisible && surveySubmenuOpen && (
                <div className="mt-1 pl-3 pr-1 flex flex-col gap-0.5">
                  {availableMonths.map((m) => {
                    const isMonthOpen = monthExpanded === m.key;
                    const monthSurveys = surveys.filter(
                      (s) => parseSurveyMonth(s.startDate).key === m.key
                    );
                    return (
                      <div key={m.key}>
                        {/* Month row — acts as a collapsible toggle */}
                        <button
                          onClick={() =>
                            setMonthExpanded((prev) => (prev === m.key ? "" : m.key))
                          }
                          className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors uppercase tracking-wide"
                        >
                          <span>{m.label}</span>
                          <ChevronDown
                            size={13}
                            className={[
                              "shrink-0 transition-transform duration-200",
                              isMonthOpen ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </button>

                        {/* Survey links under this month — collapsed by default */}
                        {isMonthOpen && (
                          <ul className="flex flex-col gap-0.5 pl-3 pb-1">
                            {monthSurveys.map((s) => {
                              const surveyPath = ROUTES.SURVEY_DETAIL(s.surveyName);
                              const isSubActive = location.pathname === surveyPath;
                              return (
                                <li key={s.surveyName}>
                                  <Link
                                    to={surveyPath}
                                    className={[
                                      "block rounded-lg px-3 py-2 text-xs transition-colors leading-snug",
                                      isSubActive
                                        ? "bg-gray-100 text-gray-900 font-medium"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                                    ].join(" ")}
                                  >
                                    {s.surveyName}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          </ul>
        </div>

        {/* ── PEOPLE group ─────────────────────────────────────── */}
        <div className="mb-6">
          <GroupLabel isVisible={isVisible} label="People" />
          <ul className="flex flex-col gap-1">
            <li>
              <button
                onClick={() => isVisible && setPmSubmenuOpen((prev) => !prev)}
                title={!isVisible ? "Project Managers" : undefined}
                className={navItemClass(isPmSectionActive, isVisible, true)}
              >
                <Users size={20} className={iconClass(isPmSectionActive)} />
                {isVisible && (
                  <>
                    <span className="flex-1 whitespace-nowrap text-left">Project Managers</span>
                    <ChevronDown
                      size={16}
                      className={[
                        "shrink-0 transition-transform duration-200",
                        pmSubmenuOpen ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </>
                )}
              </button>

              {isVisible && pmSubmenuOpen && pms.length > 0 && (
                <ul className="mt-1 flex flex-col gap-0.5 pl-9">
                  {pms.map((pm) => {
                    const pmPath = ROUTES.PM_DETAIL(pm.id);
                    const isSubActive = location.pathname === pmPath;
                    return (
                      <li key={pm.id}>
                        <Link
                          to={pmPath}
                          className={[
                            "block rounded-lg px-3 py-2 text-sm transition-colors",
                            isSubActive
                              ? "bg-gray-100 text-gray-900 font-medium"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                          ].join(" ")}
                        >
                          {pm.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          </ul>
        </div>

      </nav>
    </aside>
  );
};

/* ── Small helpers to keep JSX clean ─────────────────────────── */

function GroupLabel({ isVisible, label }: { isVisible: boolean; label: string }) {
  return (
    <div
      className={[
        "mb-3 flex",
        isVisible ? "justify-start px-2" : "lg:justify-center",
      ].join(" ")}
    >
      {isVisible ? (
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
      ) : (
        <span className="text-gray-300 text-lg leading-none">···</span>
      )}
    </div>
  );
}

function navItemClass(active: boolean, isVisible: boolean, isButton = false) {
  return [
    isButton ? "w-full" : "",
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isVisible ? "justify-start" : "lg:justify-center",
    active
      ? "bg-gray-100 text-gray-900"
      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
  ]
    .filter(Boolean)
    .join(" ");
}

function iconClass(active: boolean) {
  return ["shrink-0", active ? "text-gray-900" : "text-gray-400"].join(" ");
}
