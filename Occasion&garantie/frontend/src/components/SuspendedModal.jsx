import { FiLock, FiAlertTriangle, FiX } from 'react-icons/fi';

export default function SuspendedModal({ reason, onClose }) {
  return (
    <div className="suspended-overlay" role="dialog" aria-modal="true" aria-label="Compte suspendu">
      <div className="suspended-modal">
        <button className="suspended-close" onClick={onClose} aria-label="Fermer"><FiX size={20} /></button>
        <div className="suspended-icon">
          <FiLock size={32} />
        </div>
        <h2>Compte suspendu</h2>
        <p className="suspended-reason">
          {reason || 'Votre compte a ete suspendu par l administration.'}
        </p>
        <div className="suspended-note">
          <FiAlertTriangle size={16} />
          <span>
            Tant que votre compte est suspendu, vous ne pouvez pas effectuer d'actions sur le site.
            Contactez l'administration pour sa reactivation.
          </span>
        </div>
        <p className="suspended-contact">
          Email : <strong>contact-occasionetgarantie@proton.me</strong>
        </p>
        {onClose && (
          <button className="btn btn-outline" onClick={onClose} style={{ width: '100%', justifyContent: 'center', marginTop: '18px' }}>
            Fermer
          </button>
        )}
      </div>
    </div>
  );
}
