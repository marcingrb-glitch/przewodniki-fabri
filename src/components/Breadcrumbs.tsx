import { useLocation, Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  order: "Zamówienia",
};

// Segments that should link to a custom path instead of their natural URL
const customPaths: Record<string, string> = {
  order: "/history",
};

const Breadcrumbs = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  // If on /order/:id, fetch order_number for breadcrumb label
  const isOrderDetail = segments[0] === "order" && segments.length === 2;
  const orderId = isOrderDetail ? segments[1] : null;
  const { data: orderNumber } = useQuery({
    queryKey: ["breadcrumb-order", orderId],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("order_number").eq("id", orderId!).maybeSingle();
      return data?.order_number ?? null;
    },
    enabled: !!orderId,
    staleTime: 60_000,
  });

  if (segments.length === 0) return null;

  const crumbs: BreadcrumbEntry[] = [{ label: "Strona główna", path: "/" }];

  let currentPath = "";
  segments.forEach((seg, i) => {
    currentPath += `/${seg}`;
    const isLast = i === segments.length - 1;
    let label = routeMap[seg] || (seg.length > 8 ? `#${seg.substring(0, 8)}…` : `#${seg}`);
    // Override with order number if available
    if (isOrderDetail && i === 1 && orderNumber) {
      label = orderNumber;
    }
    const path = isLast ? undefined : (customPaths[seg] ?? currentPath);
    crumbs.push({ label, path });
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
