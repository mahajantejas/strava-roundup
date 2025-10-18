const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "http://localhost:8000";
  }
  return "";
})();

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function syncAthleteActivities(athleteId, options = {}) {
  if (!athleteId) {
    throw new Error("Missing athlete identifier");
  }

  const params = new URLSearchParams();
  if (options.since) {
    params.set("since", options.since);
  }

  const url = buildUrl(`/athletes/${athleteId}/sync${params.toString() ? `?${params}` : ""}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sync failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function fetchMonthlyRoundup(athleteId, options = {}) {
  if (!athleteId) {
    throw new Error("Missing athlete identifier");
  }

  const params = new URLSearchParams();
  if (options.month) {
    params.set("month", options.month);
  }

  const url = buildUrl(
    `/athletes/${athleteId}/roundup${params.toString() ? `?${params}` : ""}`,
  );

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fetch failed (${response.status}): ${text}`);
  }

  return response.json();
}
