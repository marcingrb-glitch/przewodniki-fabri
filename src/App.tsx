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
import LabelsLab from "@/pages/LabelsLab";
import AdminLayout from "@/pages/AdminPanel/AdminLayout";
import ProductListPage from "@/pages/AdminPanel/ProductListPage";
import Users from "@/pages/AdminPanel/Users";
import SkuFormatReference from "@/pages/AdminPanel/SkuFormatReference";
import SideExceptions from "@/pages/AdminPanel/SideExceptions";
import LabelTemplates from "@/pages/AdminPanel/LabelTemplates";
import LabelTemplatesV2 from "@/pages/AdminPanel/LabelTemplatesV2";
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
                <Route path="/labels-lab" element={<LabelsLab />} />
                <Route path="/admin" element={<AdminLayout />}>
                  {/* Global product categories */}
                  <Route path="fabrics" element={<ProtectedRoute adminOnly><ProductListPage category="fabric" /></ProtectedRoute>} />
                  <Route path="chests" element={<ProtectedRoute adminOnly><ProductListPage category="chest" /></ProtectedRoute>} />
                  <Route path="automats" element={<ProtectedRoute adminOnly><ProductListPage category="automat" /></ProtectedRoute>} />
                  <Route path="pillows" element={<ProtectedRoute adminOnly><ProductListPage category="pillow" /></ProtectedRoute>} />
                  <Route path="jaskis" element={<ProtectedRoute adminOnly><ProductListPage category="jasiek" /></ProtectedRoute>} />
                  <Route path="waleks" element={<ProtectedRoute adminOnly><ProductListPage category="walek" /></ProtectedRoute>} />
                  <Route path="finishes" element={<ProtectedRoute adminOnly><ProductListPage category="finish" /></ProtectedRoute>} />
                  <Route path="legs" element={<ProtectedRoute adminOnly><ProductListPage category="leg" /></ProtectedRoute>} />
                  {/* Per-series product categories */}
                  <Route path="extras" element={<ProtectedRoute adminOnly><ProductListPage category="extra" /></ProtectedRoute>} />
                  <Route path="seats-pufa" element={<ProtectedRoute adminOnly><ProductListPage category="seat_pufa" /></ProtectedRoute>} />
                  <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
                  <Route path="sku-format" element={<ProtectedRoute adminOnly><SkuFormatReference /></ProtectedRoute>} />
                  <Route path="side-exceptions" element={<ProtectedRoute adminOnly><SideExceptions /></ProtectedRoute>} />
                  <Route path="label-templates" element={<ProtectedRoute adminOnly><LabelTemplates /></ProtectedRoute>} />
                  <Route path="label-templates-v2" element={<ProtectedRoute adminOnly><LabelTemplatesV2 /></ProtectedRoute>} />
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
