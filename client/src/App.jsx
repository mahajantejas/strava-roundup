import { useEffect, useState } from "react";

function App() {
  const [athletes, setAthletes] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/athletes")
      .then((res) => res.json())
      .then((data) => setAthletes(data));
  }, []);

  return (
    <div>
      <h1>🏃 Athletes</h1>
      <ul>
        {athletes.map((a) => (
          <li key={a.id}>
            {a.firstname} {a.lastname} (Strava ID: {a.strava_id})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
