import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/api";

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    setError(null);
    setLoading(true);
    try {
      const redirectBase = API_BASE_URL || "";
      const redirectUrl = redirectBase ? `${redirectBase}/auth/strava` : "/auth/strava";
      window.location.href = redirectUrl;
    } catch (err) {
      setLoading(false);
      setError("Failed to redirect to Strava. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Strava Round Up
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Generate Strava Premium Like Analytics, For Free ;)
          </p>
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            size="lg"
          >
            {loading ? "Connecting to Strava…" : "Connect with Strava"}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Fuel For Your Social Flex
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Connect your Strava account and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Advanced Analytics Card */}
            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Advanced Analytics</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600 leading-relaxed">
                  Dive deep into your performance data with comprehensive charts and graphs.
                </p>
              </CardContent>
            </Card>

            {/* Social Sharing Card */}
            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Export-Ready Highlights</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600 leading-relaxed">
                Share your accomplishments with your friends and followers on your favorite social media platforms.
                </p>
              </CardContent>
            </Card>

            {/* Secure Connection Card */}
            <Card className="p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Secure Connection</CardTitle>
              </div>
              <CardContent className="p-0">
                <p className="text-gray-600 leading-relaxed">
                Read-only connection keeps your Strava data secure.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Testing Link */}
          <div className="text-center mt-12 text-sm text-gray-500">
            For testing:{" "}
            <Link to="/auth/callback" className="text-blue-600 hover:text-blue-700 underline">
              open /auth/callback
            </Link>
            .
          </div>
        </div>
      </section>
    </main>
  );
}

function IndexRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    if (params.has("status") || params.has("code")) {
      navigate(
        { pathname: "/auth/callback", search: location.search },
        { replace: true },
      );
    } else {
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/index.html" element={<IndexRedirect />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
