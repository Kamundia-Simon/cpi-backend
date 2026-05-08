import type { LucideIcon } from "lucide-react";
interface SummaryTileProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  compact?: boolean;
}

const SummaryTile = ({
  title,
  value,
  subtitle,
  icon: Icon,
  compact = false,
}: SummaryTileProps) => {
  return (
    <div
      className={`bg-white rounded-lg border shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-default flex items-center justify-between
      ${compact ? "px-5 py-3" : "p-6"}`}
    >
      <div>
        <p
          className={`font-semibold text-gray-500 ${compact ? "text-xs uppercase tracking-wide" : "text-sm"}`}
        >
          {title}
        </p>
        <p
          className={`font-bold mt-1 ${compact ? "text-lg" : "text-3xl mt-2"}`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs font-medium text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <Icon className={`text-gray-300 ${compact ? "h-6 w-6" : "h-10 w-10"}`} />
    </div>
  );
};

export default SummaryTile;
