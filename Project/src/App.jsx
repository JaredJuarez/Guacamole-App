import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import LandingPage from "./components/landing/LandingPage";
import AppLayout from "./pages/AppLayout";
import RegisterOrchard from "./components/screens/RegisterOrchard";
import ProducerDashboard from "./components/screens/ProducerDashboard";
import CaptureBatch from "./components/screens/CaptureBatch";
import QRScanner from "./components/screens/QRScanner";
import TraceabilityView from "./components/screens/TraceabilityView";

function AppIndex() {
  const { state } = useApp();
  return state.orchard ? (
    <Navigate to="/app/dashboard" replace />
  ) : (
    <Navigate to="/app/register-orchard" replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/trace/:loteId" element={<TraceabilityView />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<AppIndex />} />
        <Route path="register-orchard" element={<RegisterOrchard />} />
        <Route path="dashboard" element={<ProducerDashboard />} />
        <Route path="capture-batch" element={<CaptureBatch />} />
        <Route path="qr-scanner" element={<QRScanner />} />
        <Route path="traceability/:loteId" element={<TraceabilityView />} />
      </Route>
    </Routes>
  );
}
