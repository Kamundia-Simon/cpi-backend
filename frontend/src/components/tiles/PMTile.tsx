import { Link } from "react-router-dom";
import { User } from "lucide-react";
import type { PMId } from "../../types";
import { ROUTES } from "../../constants/routes";

interface PMTileProps {
  id: PMId;
  name: string;
  totalProjects: string;
  totalAmount: string;
}

const PMTile = ({ id, name, totalProjects, totalAmount }: PMTileProps) => {
  return (
    <Link
      to={ROUTES.PM_DETAIL(id)}
      className="bg-white rounded-lg border p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 block"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-full">
          <User className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <p className="text-lg font-semibold">{name}</p>
          <p className="text-sm text-gray-500">
            {totalProjects} projects · {totalAmount}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default PMTile;
