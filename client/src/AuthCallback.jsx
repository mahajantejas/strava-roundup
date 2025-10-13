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
  }, [status, code, decodedName, dbId]);

  const isSuccess = !loading && !!athlete && !error;
  const safeDisplayName = athlete?.displayName || "Strava athlete";
  const formattedDbId = athlete?.dbId ? `#${athlete.dbId}` : "Pending assignment";

  const handleGetActivities = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-white">
      <div className="w-full max-w-4xl">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
                {loading ? (
                  <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {loading
                    ? "Finishing your Strava sign-in"
                    : isSuccess
                    ? `Welcome aboard, ${safeDisplayName}!`
                    : "We hit a snag connecting"}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  {loading
                    ? "We're completing the secure handshake with Strava. Keep this tab open."
                    : isSuccess
                    ? "Your Strava account is now linked. We'll start syncing your latest efforts in the background."
                    : "Please retry the connection. If the issue persists, try again in a few minutes."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
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
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Strava account connected</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Your latest activities are syncing now. Feel free to close this tab once you're ready.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="bg-slate-900 text-white">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Athlete</p>
                        <p className="text-lg font-semibold">{safeDisplayName}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900 text-white">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Database record</p>
                        <p className="text-lg font-semibold">{formattedDbId}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-900 text-white">
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Next step</p>
                        <p className="text-lg font-semibold">Importing recent efforts</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* App Explainer Section */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">About Strava Roundup</h3>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                      Connect your Strava account and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-3"></div>
                      <h4 className="font-semibold text-slate-900 mb-1">Monthly Analytics</h4>
                      <p className="text-sm text-slate-600">Month by month miles and minutes spent sweating it out.</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-3"></div>
                      <h4 className="font-semibold text-slate-900 mb-1">Export Ready</h4>
                      <p className="text-sm text-slate-600">Export-ready highlights that fuel your flex.</p>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 mx-auto mb-3"></div>
                      <h4 className="font-semibold text-slate-900 mb-1">Secure Connection</h4>
                      <p className="text-sm text-slate-600">Read-only connection keeps your Strava data secure</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to explore your data?</h3>
                    <p className="text-slate-600 mb-6">Get started by syncing your activities and viewing your analytics dashboard.</p>
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

                  <div className="text-center text-sm text-slate-500">
                    Connected as <strong>{safeDisplayName}</strong>
                    {athlete?.dbId ? ` · record ${formattedDbId}` : ""}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
