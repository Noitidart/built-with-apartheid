import CompanyCard from "@/components/CompanyCard";
import { type CompanyId } from "@/pages/types/companies";

type CompanyListProps = {
  companyIds: CompanyId[];
};

export default function CompanyList({ companyIds }: CompanyListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {companyIds.map((companyId) => (
        <CompanyCard key={companyId} companyId={companyId} />
      ))}
    </div>
  );
}
