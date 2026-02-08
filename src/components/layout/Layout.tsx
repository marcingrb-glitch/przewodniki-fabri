import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const Layout = () => {
  useKeyboardShortcuts();
  const location = useLocation();
  const showBreadcrumbs = location.pathname !== "/";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        {showBreadcrumbs && <Breadcrumbs />}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
