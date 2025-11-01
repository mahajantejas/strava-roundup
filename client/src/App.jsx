import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import Help from "./Help";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/api";
import { Github } from "lucide-react";
import stravaConnect from "@/assets/strava-connect.svg";
import shortlistCycline2 from "@/assets/shortlist_cycline2.jpg";
import shortlistCycling from "@/assets/shortlist_cycling.jpg";
import shortlistRun from "@/assets/shortlist_run.jpg";
import shortlistRun2 from "@/assets/shortlist_run2.jpg";
import shortlistRun3 from "@/assets/shortlist_run3.jpg";
import shortlistSwim from "@/assets/shortlist_swim.jpg";
import shortlistSwim2 from "@/assets/shortlist_swim2.jpg";
import shortlistWorkout from "@/assets/shortlist_workout.jpg";
import shortlistWorkout2 from "@/assets/shortlist_workout2.jpg";

const landingImages = [
  shortlistCycline2,
  shortlistCycling,
  shortlistRun,
  shortlistRun2,
  shortlistRun3,
  shortlistSwim,
  shortlistSwim2,
  shortlistWorkout,
  shortlistWorkout2,
];

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [heroImage] = useState(() => {
    if (!landingImages.length) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * landingImages.length);
    return landingImages[randomIndex];
  });

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
            backgroundImage: heroImage ? `url(${heroImage})` : undefined,
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
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            aria-label="Connect with Strava"
            className="inline-flex items-center justify-center bg-transparent rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
          >
            <img src={stravaConnect} alt="" className="h-14 w-auto" />
            <span className="sr-only">Connect with Strava</span>
          </button>
          <div className="mt-4 text-sm text-gray-200 min-h-[1.5rem]" aria-live="polite">
            {loading ? "Connecting to Strava…" : null}
          </div>
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

        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span>Practically no rights reserved.</span>
            <span>Made with ❤️ by Tejas</span>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="https://github.com/mahajantejas/strava-roundup"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-orange-400 hover:text-orange-300 underline underline-offset-4"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              <span>View on GitHub</span>
            </a>
            <Link to="/help" className="text-orange-400 hover:text-orange-300 underline underline-offset-4">
              Help &amp; FAQs
            </Link>
          </div>
        </div>
      </footer>
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
        <Route path="/help" element={<Help />} />
      </Routes>
    </BrowserRouter>
  );
}
