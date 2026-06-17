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
                <NavLink to="/admin" className="admin-btn">
                  <FiSettings size={14} /> Admin
                </NavLink>
              )}
              <span className="user-badge">
                <FiUser size={14} /> {user.fullName}
              </span>
              <button onClick={logout} className="logout-btn">
                <FiLogOut size={14} /> Déconnexion
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
