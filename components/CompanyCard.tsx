import { COMPANIES, type CompanyId } from "@/constants/companies";
import { CheckCircle } from "lucide-react";

type TechnologyCardProps = {
  companyId: CompanyId;
};

export default function CompanyCard({ companyId }: TechnologyCardProps) {
  const company = COMPANIES.find((c) => c.id === companyId);
  if (!company) {
    throw new Error(`Company with ID ${companyId} not found`);
  }

  return (
    <div className="p-4 border rounded-lg flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 relative flex-shrink-0">
          <company.Logo />
        </div>
        <span className="text-lg font-medium">{company.name}</span>
      </div>
      <div>
        <div className="flex items-center gap-1 text-green-500">
          <CheckCircle size={16} />
          <span>Detected</span>
        </div>
      </div>
    </div>
  );
}
