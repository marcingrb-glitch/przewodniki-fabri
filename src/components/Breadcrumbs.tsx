import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  path?: string;
}

const routeMap: Record<string, string> = {
  "": "Strona główna",
  history: "Historia zamówień",
  admin: "Panel Admin",
  order: "Zamówienie",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs: BreadcrumbEntry[] = [{ label: "Strona główna", path: "/" }];

  let currentPath = "";
  segments.forEach((seg, i) => {
    currentPath += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = routeMap[seg] || (seg.length > 8 ? `#${seg.substring(0, 8)}…` : `#${seg}`);
    crumbs.push({ label, path: isLast ? undefined : currentPath });
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <BreadcrumbItem key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            {crumb.path ? (
              <BreadcrumbLink asChild>
                <Link to={crumb.path}>{crumb.label}</Link>
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default Breadcrumbs;
