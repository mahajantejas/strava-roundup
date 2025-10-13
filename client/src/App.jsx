import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AuthCallback from "./AuthCallback";
import "./App.css";

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
    <main className="app">
      <header className="hero">
        <div className="hero__content">
          <span className="hero__eyebrow">Strava Roundup</span>
          <h1 className="hero__headline">Strava Premium Visuals, for free ;)</h1>
          <p className="hero__body">
            Connect your Strava account and generate beautiful roundups of your workouts and breakthrough efforts—perfect for sharing or tracking your goals.
          </p>

          <ul className="hero__features">
            <li>Month by month miles and minutes spent sweating it out.</li>
            <li>Export-ready highlights that fuel your flex.</li>
            <li>Read-only connection keeps your Strava data secure</li>
          </ul>

          <div className="hero__actions">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="hero__cta"
              aria-busy={loading}
            >
              {loading ? "Connecting to Strava…" : "Connect with Strava"}
            </button>
            <p className="hero__note">Secured with Strava OAuth. We never post or modify your activities.</p>
          </div>

          {error && <div className="hero__error">{error}</div>}

          <small>
            For testing:{" "}
            <Link to="/auth/callback" className="hero__testing">
              open /auth/callback
            </Link>
            .
          </small>
        </div>

        <aside className="hero__visual" aria-hidden="true">
          <div className="hero__visual-card">
            <span className="hero__visual-chip">Preview</span>
            <div className="hero__visual-grid">
              <div>
                <span className="hero__visual-label">Total distance</span>
                <span className="hero__visual-metric">1,248 km</span>
              </div>
              <div>
                <span className="hero__visual-label">Elevation gain</span>
                <span className="hero__visual-metric">31,420 m</span>
              </div>
              <div>
                <span className="hero__visual-label">Active time</span>
                <span className="hero__visual-metric">182 h</span>
              </div>
            </div>
            <div className="hero__visual-footer">
              <span>Longest streak</span>
              <strong>21 days</strong>
            </div>
          </div>
        </aside>
      </header>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </BrowserRouter>
  );
}
