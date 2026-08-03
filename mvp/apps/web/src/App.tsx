import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { SourcesPage } from './pages/SourcesPage';
import { SourceDetailPage } from './pages/SourceDetailPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <Link to="/" className="brand">
            ROUAA
            <span className="brand-tag">Source Registry Console</span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/sources" className={({ isActive }) => (isActive ? 'active' : '')}>
              Sources
            </NavLink>
          </nav>
          <div className="env-badge">MVP Sprint 0</div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/sources/:id" element={<SourceDetailPage />} />
          </Routes>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>© 2026 ROUAA — The Trust Layer Between Financial Data and Institutional Decisions.</p>
          <p className="muted">MVP Sprint 0 · Backend: NestJS · Frontend: React + Vite · DB: PostgreSQL + pgvector</p>
        </div>
      </footer>
    </div>
  );
}
