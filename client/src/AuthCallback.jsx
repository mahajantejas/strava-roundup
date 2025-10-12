import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./AuthCallback.css";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
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

  const headerBadge = loading ? "…" : isSuccess ? "✓" : "!";
  const headerTitle = loading
    ? "Finishing your Strava sign-in"
    : isSuccess
    ? `Welcome aboard, ${safeDisplayName}!`
    : "We hit a snag connecting";
  const headerSubtitle = loading
    ? "We’re completing the secure handshake with Strava. Keep this tab open."
    : isSuccess
    ? "Your Strava account is now linked. We’ll start syncing your latest efforts in the background."
    : "Please retry the connection. If the issue persists, try again in a few minutes.";

  return (
    <div className="callback">
      <section className="callback__card" aria-live="polite">
        <div className="callback__header">
          <span className="callback__badge" aria-hidden="true">
            {headerBadge}
          </span>
          <div>
            <h1 className="callback__title">{headerTitle}</h1>
            <p className="callback__muted">{headerSubtitle}</p>
          </div>
        </div>

        {loading && (
          <>
            <div className="callback__status">
              <span className="callback__status-icon" aria-hidden="true">
                ⏳
              </span>
              <div className="callback__status-text">
                <strong>Connecting to Strava</strong>
                <span>Authorizing your account and exchanging secure tokens…</span>
              </div>
            </div>
            <div className="callback__loading">
              <span className="callback__loader" aria-hidden="true" />
              <span>Hang tight—this usually takes less than ten seconds.</span>
            </div>
          </>
        )}

        {!loading && error && (
          <div className="callback__status callback__status--error">
            <span className="callback__status-icon" aria-hidden="true">
              ⚠️
            </span>
            <div className="callback__status-text">
              <strong>Sign-in failed</strong>
              <span>
                {error}{" "}
                <Link to="/" className="callback__error-link">
                  Return home and try again
                </Link>
                .
              </span>
            </div>
          </div>
        )}

        {isSuccess && (
          <>
            <div className="callback__status callback__status--success">
              <span className="callback__status-icon" aria-hidden="true">
                ✅
              </span>
              <div className="callback__status-text">
                <strong>Strava account connected</strong>
                <span>Your latest activities are syncing now. Feel free to close this tab once you’re ready.</span>
              </div>
            </div>

            <div className="callback__details">
              <div className="callback__grid">
                <div className="callback__metric">
                  <span className="callback__metric-label">Athlete</span>
                  <span className="callback__metric-value">{safeDisplayName}</span>
                </div>
                <div className="callback__metric">
                  <span className="callback__metric-label">Database record</span>
                  <span className="callback__metric-value">{formattedDbId}</span>
                </div>
                <div className="callback__metric">
                  <span className="callback__metric-label">Next step</span>
                  <span className="callback__metric-value">Importing recent efforts</span>
                </div>
              </div>

              <div className="callback__actions">
                <Link to="/" className="callback__link">
                  Go to dashboard (coming soon)
                </Link>
                <Link to="/" className="callback__link callback__link--secondary">
                  Explore the landing page
                </Link>
                <span className="callback__id">
                  Connected as <strong>{safeDisplayName}</strong>
                  {athlete?.dbId ? ` · record ${formattedDbId}` : ""}
                </span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
