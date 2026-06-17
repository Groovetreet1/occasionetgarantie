import { Link, NavLink } from 'react-router-dom';
import { FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="logo">Occasion & Garantie</Link>
        <div className="nav-links">
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/products">Produits</NavLink>
          <ThemeToggle />
          {user ? (
            <>
              {user.role === 'admin' && (
                <NavLink to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)' }}>
                  <FiSettings size={14} /> Admin
                </NavLink>
              )}
              <span className="btn-ghost" style={{ cursor: 'default' }}>
                <FiUser size={16} /> {user.fullName}
              </span>
              <button onClick={logout} className="btn-ghost">
                <FiLogOut size={16} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Connexion</NavLink>
              <Link to="/signup" className="btn btn-primary" style={{ padding: '8px 20px' }}>
                S&rsquo;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
