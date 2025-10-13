import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const rawName = searchParams.get("name");
  const dbId = searchParams.get("db_id");
  const stravaId = searchParams.get("strava_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [athlete, setAthlete] = useState(null);

  const decodedName = useMemo(() => {
    if (!rawName) {
      return null;
    }
    try {
      return decodeURIComponent(rawName).trim();
    } catch {
      return rawName.replace(/\+/g, " ").trim();
    }
  }, [rawName]);

  useEffect(() => {
    // Store athlete name in localStorage for dashboard
    if (decodedName) {
      localStorage.setItem('athleteName', decodedName);
    }

    // Backend already exchanged the code and redirected with a status flag.
    if (status) {
      const normalized = status.toLowerCase();
      if (normalized === "success") {
        const [firstname = "", ...rest] = (decodedName || "").split(" ");
        const lastname = rest.join(" ").trim();
        setAthlete({
          firstname: firstname || decodedName || "Strava athlete",
          lastname,
          displayName: decodedName || firstname || "Strava athlete",
          dbId,
          stravaId,
        });
        setError(null);
      } else {
        setError("We could not finalize the sign-in flow. Please retry connecting your Strava account.");
        setAthlete(null);
      }
      setLoading(false);
      return;
    }

    if (!code) {
      setError("No authorization code found in URL.");
      setLoading(false);
      return;
    }

    const doExchange = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/auth/strava/callback?code=${encodeURIComponent(code)}`, {
          credentials: "same-origin",
        });

        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Backend error: ${resp.status} ${text}`);
        }

        const body = await resp.json();
        setAthlete({
          firstname: body?.athlete?.firstname,
          lastname: body?.athlete?.lastname,
          displayName: [body?.athlete?.firstname, body?.athlete?.lastname].filter(Boolean).join(" "),
          dbId: body?.db_id,
        });
      } catch (err) {
        setError(err.message || "Sign-in failed");
      } finally {
        setLoading(false);
      }
    };

    doExchange();
  }, [status, code, decodedName, dbId, stravaId]);

  const isSuccess = !loading && !!athlete && !error;
  const safeDisplayName = athlete?.displayName || "Strava athlete";
  const formattedDbId = athlete?.dbId ? `#${athlete.dbId}` : "Pending assignment";

  const handleGetActivities = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-lg border border-gray-200 bg-white">
          <CardHeader className="text-center pb-8 pt-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
            <CardTitle className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {loading
                ? "Finishing your Strava sign-in"
                : isSuccess
                ? `Welcome aboard, ${safeDisplayName}!`
                : "We hit a snag connecting"}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {loading
                ? "We're completing the secure handshake with Strava. Keep this tab open."
                : isSuccess
                ? "Your Strava account is now linked!"
                : "Please retry the connection. If the issue persists, try again in a few minutes."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 px-8 pb-8">
            {loading && (
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Connecting to Strava</AlertTitle>
                  <AlertDescription>
                    Authorizing your account and exchanging secure tokens…
                  </AlertDescription>
                </Alert>
                <div className="flex items-center justify-center gap-3 text-slate-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Hang tight—this usually takes less than ten seconds.</span>
                </div>
              </div>
            )}

            {!loading && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>
                  {error}{" "}
                  <Link to="/" className="underline font-semibold hover:no-underline">
                    Return home and try again
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            )}

            {isSuccess && (
              <div className="space-y-8">
                {/* Action Buttons - Moved to top */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to explore your data?</h3>
                    <p className="text-slate-600 mb-6"></p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleGetActivities}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      size="lg"
                    >
                      Get All Activities
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="px-8 py-3 rounded-full"
                      size="lg"
                    >
                      Back to Home
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* App Explainer Section - Updated to match landing page */}
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Fuel For Your Social Flex</h3>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                      Connect your activities and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
                    </p>
                  </div>

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

                    {/* Export-Ready Highlights Card */}
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
                </div>

                <Separator />

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                  Connected as <strong>{safeDisplayName}</strong>
                  {athlete?.stravaId ? ` · Strava Id  #${athlete.stravaId}` : ""}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
