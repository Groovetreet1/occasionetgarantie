import { useEffect, useState } from 'react';
import { FiArrowUp, FiHeadphones, FiX, FiSend, FiCheckCircle, FiMail } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SupportFloat() {
  const { user } = useAuth();
  const [showScroll, setShowScroll] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.fullName || user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [sentName, setSentName] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  useEffect(() => {
    const handle = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    if (user?.fullName || user?.full_name) setName(user.fullName || user.full_name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/contact', { name: name.trim(), message: message.trim(), email: email.trim() || undefined });
      setTicketNumber(res.data.ticketNumber || '');
      setSentName(name.trim());
      setSentMessage(message.trim());
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setDone(false); setError(''); setName(user?.fullName || user?.full_name || ''); setEmail(user?.email || ''); setMessage(''); setTicketNumber(''); setSentName(''); setSentMessage(''); }, 300);
  };

  const handleNewTicket = () => {
    setDone(false);
    setMessage('');
    setTicketNumber('');
    setSentName('');
    setSentMessage('');
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
                {ticketNumber && <div className="ticket-number">Ticket #<strong>{ticketNumber}</strong></div>}
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>{sentName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{email}</div>
                  {sentMessage}
                </div>
                <small style={{ display: 'block', marginTop: '12px' }}>Nous vous repondrons par email.</small>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button onClick={handleNewTicket} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '12px' }}>Nouveau ticket</button>
                  <button onClick={handleClose} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: 'var(--gradient)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '12px', fontWeight: 600 }}>Fermer</button>
                </div>
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
                    readOnly={!!user}
                    style={user ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  />
                </div>
                <div className="form-group">
                  <div style={{ position: 'relative' }}>
                    <FiMail size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      placeholder="Votre email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      readOnly={!!user}
                      style={{ paddingLeft: '32px', ...(user ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                    />
                  </div>
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
