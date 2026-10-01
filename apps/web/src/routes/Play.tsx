import { useEffect, useRef } from 'react';
import { mountGame } from '../game/mount';

export function Play() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => (host.current ? mountGame(host.current) : undefined), []);

  return <div ref={host} style={{ width: '100vw', height: '100vh' }} />;
}
