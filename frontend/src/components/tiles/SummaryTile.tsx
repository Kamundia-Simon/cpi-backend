import type { LucideIcon } from "lucide-react";
interface SummaryTileProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}

const SummaryTile = ({
  title,
  value,
  subtitle,
  icon: Icon,
}: SummaryTileProps) => {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md hover:border-black-300 transition-all duration-200 cursor-default">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{title}</p>
        <Icon className="h-10 w-10 text-black-400" />
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
      {subtitle && <p className="text-sm font-medium text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export default SummaryTile;
