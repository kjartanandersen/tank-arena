import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Home } from './routes/Home.tsx';
import { Play } from './routes/Play.tsx';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/play', element: <Play /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
