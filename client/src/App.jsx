import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import Dashboard from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function Landing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = () => {
    setError(null);
    setLoading(true);
    try {
      window.location.href = "/auth/strava";
    } catch (err) {
      setLoading(false);
      setError("Failed to redirect to Strava. Please try again.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-white">
      <div className="w-full max-w-6xl">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-8 lg:p-12">
            {/* Content Section */}
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sky-600 bg-sky-50 border-sky-200">
                  Strava Roundup
                </Badge>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                  Strava Premium Visuals, for free ;)
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
                  Connect your Strava account and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Month by month miles and minutes spent sweating it out.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Export-ready highlights that fuel your flex.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Read-only connection keeps your Strava data secure</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  size="lg"
                >
                  {loading ? "Connecting to Strava…" : "Connect with Strava"}
                </Button>
                <p className="text-sm text-slate-500">
                  Secured with Strava OAuth. We never post or modify your activities.
                </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  {error}
                </div>
              )}

              <div className="text-sm text-slate-500">
                For testing:{" "}
                <Link to="/auth/callback" className="text-sky-600 hover:text-sky-700 underline">
                  open /auth/callback
                </Link>
                .
              </div>
            </div>

            {/* Visual Section */}
            <div className="relative">
              <div className="bg-gradient-to-br from-sky-100/50 to-blue-200/30 rounded-2xl border border-slate-200/50 p-6 lg:p-8 h-full">
                <Card className="bg-slate-900/90 backdrop-blur-sm border-slate-700/50 text-white shadow-2xl">
                  <CardHeader className="pb-4">
                    <Badge variant="outline" className="w-fit text-sky-300 border-slate-600 bg-slate-800/50">
                      Preview
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Total distance</p>
                        <p className="text-2xl font-semibold">1,248 km</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Elevation gain</p>
                        <p className="text-2xl font-semibold">31,420 m</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Active time</p>
                        <p className="text-2xl font-semibold">182 h</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-700/50">
                      <span className="text-sm text-slate-300">Longest streak</span>
                      <span className="font-semibold">21 days</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
