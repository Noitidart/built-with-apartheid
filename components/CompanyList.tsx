import { COMPANIES, CompanyId } from "@/constants/companies";
import { useState } from "react";

interface CompanyListProps {
  companyIds: CompanyId[];
  isProbablyMasjid?: boolean;
}

export default function CompanyList({
  companyIds,
  isProbablyMasjid,
}: CompanyListProps) {
  const [expandedCompany, setExpandedCompany] = useState<CompanyId | null>(
    null
  );

  const toggleExpand = (id: CompanyId) => {
    setExpandedCompany(expandedCompany === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {companyIds.map((id) => {
        const company = COMPANIES.find((c) => c.id === id);
        if (!company) {
          throw new Error(`Company with ID ${id} not found`);
        }

        const isExpanded = expandedCompany === id;

        return (
          <company.Article
            key={id}
            isProbablyMasjid={isProbablyMasjid}
            isExpanded={isExpanded}
            toggleExpanded={() => toggleExpand(id)}
          />
        );
      })}
    </div>
  );
}
