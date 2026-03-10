import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
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
import Users from "@/pages/AdminPanel/Users";
import ParseRules from "@/pages/AdminPanel/ParseRules";
import SideExceptions from "@/pages/AdminPanel/SideExceptions";
import LabelTemplates from "@/pages/AdminPanel/LabelTemplates";
import GuideTemplates from "@/pages/AdminPanel/GuideTemplates";
import DecodingTemplates from "@/pages/AdminPanel/DecodingTemplates";
import SeriesSpecification from "@/pages/AdminPanel/SeriesSpecification";
import Cheatsheets from "@/pages/AdminPanel/Cheatsheets";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<NewOrderPage />} />
                <Route path="/order/:id" element={<OrderDetailsPage />} />
                <Route path="/history" element={<OrderHistoryPage />} />
                <Route path="/admin" element={<AdminLayout />}>
                  {/* Admin-only routes */}
                  <Route index element={<ProtectedRoute adminOnly><Series /></ProtectedRoute>} />
                  <Route path="series" element={<ProtectedRoute adminOnly><Series /></ProtectedRoute>} />
                  <Route path="fabrics" element={<ProtectedRoute adminOnly><Fabrics /></ProtectedRoute>} />
                  <Route path="chests" element={<ProtectedRoute adminOnly><Chests /></ProtectedRoute>} />
                  <Route path="automats" element={<ProtectedRoute adminOnly><Automats /></ProtectedRoute>} />
                  <Route path="pillows" element={<ProtectedRoute adminOnly><Pillows /></ProtectedRoute>} />
                  <Route path="jaskis" element={<ProtectedRoute adminOnly><Jaskis /></ProtectedRoute>} />
                  <Route path="waleks" element={<ProtectedRoute adminOnly><Waleks /></ProtectedRoute>} />
                  <Route path="finishes" element={<ProtectedRoute adminOnly><Finishes /></ProtectedRoute>} />
                  <Route path="seats-sofa" element={<ProtectedRoute adminOnly><SeatsSofa /></ProtectedRoute>} />
                  <Route path="seats-pufa" element={<ProtectedRoute adminOnly><SeatsPufa /></ProtectedRoute>} />
                  <Route path="backrests" element={<ProtectedRoute adminOnly><Backrests /></ProtectedRoute>} />
                  <Route path="sides" element={<ProtectedRoute adminOnly><Sides /></ProtectedRoute>} />
                  <Route path="legs" element={<ProtectedRoute adminOnly><Legs /></ProtectedRoute>} />
                  <Route path="extras" element={<ProtectedRoute adminOnly><Extras /></ProtectedRoute>} />
                  <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
                  <Route path="parse-rules" element={<ProtectedRoute adminOnly><ParseRules /></ProtectedRoute>} />
                  <Route path="side-exceptions" element={<ProtectedRoute adminOnly><SideExceptions /></ProtectedRoute>} />
                  <Route path="label-templates" element={<ProtectedRoute adminOnly><LabelTemplates /></ProtectedRoute>} />
                  <Route path="guide-templates" element={<ProtectedRoute adminOnly><GuideTemplates /></ProtectedRoute>} />
                  <Route path="decoding-templates" element={<ProtectedRoute adminOnly><DecodingTemplates /></ProtectedRoute>} />
                  {/* Permission-based routes */}
                  <Route path="spec/:seriesCode" element={<ProtectedRoute requiredPermission="can_view_specs"><SeriesSpecification /></ProtectedRoute>} />
                  <Route path="cheatsheets" element={<ProtectedRoute requiredPermission="can_view_cheatsheets"><Cheatsheets /></ProtectedRoute>} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
