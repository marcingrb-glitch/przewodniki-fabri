import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import NewOrderPage from "@/pages/NewOrderPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import OrderHistoryPage from "@/pages/OrderHistoryPage";
import AdminLayout from "@/pages/AdminPanel/AdminLayout";
import Series from "@/pages/AdminPanel/Series";
import Fabrics from "@/pages/AdminPanel/Fabrics";
import Chests from "@/pages/AdminPanel/Chests";
import Automats from "@/pages/AdminPanel/Automats";
import Pillows from "@/pages/AdminPanel/Pillows";
import Jaskis from "@/pages/AdminPanel/Jaskis";
import Waleks from "@/pages/AdminPanel/Waleks";
import Finishes from "@/pages/AdminPanel/Finishes";
import SeatsSofa from "@/pages/AdminPanel/SeatsSofa";
import SeatsPufa from "@/pages/AdminPanel/SeatsPufa";
import Backrests from "@/pages/AdminPanel/Backrests";
import Sides from "@/pages/AdminPanel/Sides";
import Legs from "@/pages/AdminPanel/Legs";
import Extras from "@/pages/AdminPanel/Extras";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<NewOrderPage />} />
              <Route path="/order/:id" element={<OrderDetailsPage />} />
              <Route path="/history" element={<OrderHistoryPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Series />} />
                <Route path="series" element={<Series />} />
                <Route path="fabrics" element={<Fabrics />} />
                <Route path="chests" element={<Chests />} />
                <Route path="automats" element={<Automats />} />
                <Route path="pillows" element={<Pillows />} />
                <Route path="jaskis" element={<Jaskis />} />
                <Route path="waleks" element={<Waleks />} />
                <Route path="finishes" element={<Finishes />} />
                <Route path="seats-sofa" element={<SeatsSofa />} />
                <Route path="seats-pufa" element={<SeatsPufa />} />
                <Route path="backrests" element={<Backrests />} />
                <Route path="sides" element={<Sides />} />
                <Route path="legs" element={<Legs />} />
                <Route path="extras" element={<Extras />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
