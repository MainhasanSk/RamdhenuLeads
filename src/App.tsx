import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LeadProvider } from "@/context/LeadContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import AddLead from "@/pages/AddLead";
import LeadsPage from "@/pages/LeadsPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <LeadProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-lead" element={<AddLead />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </LeadProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
