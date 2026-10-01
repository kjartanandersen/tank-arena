import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { HealthResponse } from '@arena/contracts';

export function Home() {
  const [health, setHealth] = useState<HealthResponse | 'error' | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((json) => setHealth(HealthResponse.parse(json)))
      .catch(() => setHealth('error'));
  }, []);

  const status =
    health === null
      ? 'checking…'
      : health === 'error'
        ? 'unreachable'
        : `ok (sim v${health.simVersion})`;

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>Tank Arena</h1>
      <p>API: {status}</p>
      <Link to="/play">Play</Link>
    </main>
  );
}
