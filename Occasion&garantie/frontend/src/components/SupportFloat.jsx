import { useEffect, useState } from 'react';
import { FiArrowUp, FiHeadphones, FiX, FiSend, FiCheckCircle } from 'react-icons/fi';
import api from '../api/axios';

export default function SupportFloat() {
  const [showScroll, setShowScroll] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/contact', { name: name.trim(), message: message.trim() });
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setName(''); setMessage(''); }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setDone(false); setError(''); }, 300);
  };

  return (
    <div className="support-float">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="scroll-top-btn"
        style={{ display: showScroll ? 'flex' : 'none' }}
        title="Retour en haut"
      >
        <FiArrowUp size={22} />
      </button>

      {open && (
        <div className="support-popup">
          <div className="support-popup-header">
            <FiHeadphones size={18} />
            <span>Support</span>
            <button className="support-popup-close" onClick={handleClose}><FiX size={18} /></button>
          </div>

          <div className="support-popup-body">
            {done ? (
              <div className="support-popup-success">
                <FiCheckCircle size={36} />
                <p>Message envoye avec succes !</p>
                <small>Nous vous repondrons par email.</small>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-error" style={{ marginBottom: '10px', fontSize: '12px' }}>{error}</div>}
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    rows={4}
                    placeholder="Decrivez votre probleme..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="form-submit" disabled={loading} style={{ fontSize: '14px', padding: '10px' }}>
                  {loading ? 'Envoi...' : <><FiSend size={14} /> Envoyer</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="support-btn"
        title="Questions ? Contactez le support"
      >
        {open ? <FiX size={24} /> : <FiHeadphones size={24} />}
      </button>
    </div>
  );
}
