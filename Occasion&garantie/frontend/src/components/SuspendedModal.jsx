import { FiLock, FiAlertTriangle } from 'react-icons/fi';

export default function SuspendedModal({ reason }) {
  return (
    <div className="suspended-overlay" role="dialog" aria-modal="true" aria-label="Compte suspendu">
      <div className="suspended-modal">
        <div className="suspended-icon">
          <FiLock size={34} />
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
      </div>
    </div>
  );
}
