
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./lib/firebase";

// Existing landing page components (untouched)
import Navbar        from "./components/Navbar";
import Hero          from "./components/Hero";
import TechShowcase  from "./components/TechShowcase";
import VisionSection from "./components/VisionSection";
import CTASection    from "./components/CTASection";
import FAQSection    from "./components/FAQSection";
import Footer        from "./components/Footer";

// New auth + scanner components
import { LoginPage, SignupPage, ProtectedRoute } from "./components/AuthPages";
import ScannerDashboard from "./components/ScannerDashboard";

// Your existing landing page assembled
function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <TechShowcase />
      <VisionSection />
      <CTASection />
      <FAQSection />
      <Footer />
    </>
  );
}

export default function App() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — landing page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages */}
        <Route path="/login"  element={user ? <Navigate to="/scanner" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/scanner" replace /> : <SignupPage />} />

        {/* Protected scanner */}
        <Route
  path="/scanner"
  element={
    <ProtectedRoute user={user} loading={loading}>
      <ScannerDashboard />
    </ProtectedRoute>
  }
/>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
