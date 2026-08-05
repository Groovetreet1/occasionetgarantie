import { useEffect, useRef, useState } from 'react';
import { FiArrowUp, FiHeadphones, FiX, FiSend, FiCheckCircle, FiMail, FiAlertCircle, FiEdit3, FiInfo, FiLock } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SupportFloat() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const baseChoices = [
    { value: 'reclamation', label: t('common.supportReclamation'), icon: FiAlertCircle, color: '#dc2626', desc: t('common.supportReclamationDesc') },
    { value: 'suspension', label: t('common.supportSuspended'), icon: FiLock, color: '#7c3aed', desc: t('common.supportSuspendedDesc') },
    { value: 'information', label: t('common.supportInfo'), icon: FiInfo, color: '#10b981', desc: t('common.supportInfoDesc') },
  ];
  const storeNameChoice = { value: 'changement_nom_store', label: t('common.supportStoreName'), icon: FiEdit3, color: '#3b82f6', desc: t('common.supportStoreNameDesc') };
  const [showScroll, setShowScroll] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const [step, setStep] = useState('choices'); // choices | form | done
  const [selectedType, setSelectedType] = useState(null);
  const [name, setName] = useState(user?.fullName || user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [sentName, setSentName] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [sentType, setSentType] = useState('');

  useEffect(() => {
    const handle = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) handleClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (user?.fullName || user?.full_name) setName(user.fullName || user.full_name);
    if (user?.email) setEmail(user.email);
  }, [user]);

  const isStoreOwner = user?.role === 'seller' || user?.role === 'admin';
  const choices = isStoreOwner
    ? [...baseChoices, storeNameChoice]
    : baseChoices;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/contact', { name: name.trim(), message: message.trim(), email: email.trim() || undefined, type: selectedType });
      setTicketNumber(res.data.ticketNumber || '');
      setSentName(name.trim());
      setSentMessage(message.trim());
      setSentType(selectedType);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || t('common.sendError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => { setStep('choices'); setSelectedType(null); setError(''); setName(user?.fullName || user?.full_name || ''); setEmail(user?.email || ''); setMessage(''); setTicketNumber(''); setSentName(''); setSentMessage(''); setSentType(''); }, 300);
  };

  const handleNewTicket = () => {
    setStep('choices');
    setSelectedType(null);
    setMessage('');
    setTicketNumber('');
    setSentName('');
    setSentMessage('');
    setSentType('');
  };

  const selectChoice = (value) => {
    setSelectedType(value);
    setStep('form');
  };

  return (
    <div className="support-float" ref={rootRef}>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="scroll-top-btn"
        style={{ display: showScroll ? 'flex' : 'none' }}
        title={t('common.scrollToTop')}
      >
        <FiArrowUp size={22} />
      </button>

      {open && (
        <div className="support-popup">
          <div className="support-popup-header">
            <FiHeadphones size={18} />
            <span>{t('common.support')}</span>
            <button className="support-popup-close" onClick={handleClose}><FiX size={18} /></button>
          </div>

          <div className="support-popup-body">
            {step === 'choices' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{t('common.supportHelpQuestion')}</p>
                {choices.map(c => {
                  const Icon = c.icon;
                  return (
                    <button key={c.value} onClick={() => selectChoice(c.value)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = `${c.color}08`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={20} color={c.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 'form' && (
              <form onSubmit={handleSubmit}>
                {error && <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 12 }}>{error}</div>}
                <button type="button" onClick={() => { setStep('choices'); setSelectedType(null); setError(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, marginBottom: 12, padding: 0, fontFamily: 'var(--font)' }}>
                  <FiArrowUp size={14} style={{ transform: 'rotate(-90deg)' }} /> {t('common.back')}
                </button>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '8px 12px', background: `${choices.find(c => c.value === selectedType)?.color}10`, borderRadius: 8, border: `1px solid ${choices.find(c => c.value === selectedType)?.color}20` }}>
                  {choices.find(c => c.value === selectedType)?.label}
                </div>
                <div className="form-group">
                  <input type="text" placeholder={t('common.yourName')} value={name} onChange={(e) => setName(e.target.value)} required
                    readOnly={!!user}
                    style={user ? { opacity: 0.7, cursor: 'not-allowed' } : {}} />
                </div>
                <div className="form-group">
                  <div style={{ position: 'relative' }}>
                    <FiMail size={16} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                    <input type="email" placeholder={t('common.yourEmail')} value={email} onChange={(e) => setEmail(e.target.value)} required
                      readOnly={!!user}
                      style={{ paddingLeft: 32, ...(user ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }} />
                  </div>
                </div>
                <div className="form-group">
                  <textarea rows={4}
                    placeholder={selectedType === 'changement_nom_store' ? t('common.storeNameChangePlaceholder') : selectedType === 'suspension' ? t('common.suspensionExplainPlaceholder') : t('common.describeRequestPlaceholder')}
                    value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <button type="submit" className="form-submit" disabled={loading} style={{ fontSize: 14, padding: 10 }}>
                  {loading ? t('common.sending') : <><FiSend size={14} /> {t('common.send')}</>}
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="support-popup-success">
                <FiCheckCircle size={36} />
                <p>{t('common.messageSent')}</p>
                {ticketNumber && <div className="ticket-number">{t('common.ticket')} #<strong>{ticketNumber}</strong></div>}
                <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 12, color: 'var(--text-muted)' }}>{sentName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{email}</div>
                  {sentMessage}
                </div>
                {sentType === 'changement_nom_store' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#3b82f6', background: 'rgba(59,130,246,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                    {t('common.storeChangeProcessed')}
                  </div>
                )}
                {sentType === 'reclamation' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', background: 'rgba(220,38,38,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                    {t('common.reclamationTracked')}
                  </div>
                )}
                {sentType === 'suspension' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                    {t('common.reactivationSent')}
                  </div>
                )}
                <small style={{ display: 'block', marginTop: 12 }}>{t('common.weReplyByEmail')}</small>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={handleNewTicket} style={{ flex: 1, padding: 8, border: '1px solid var(--border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12 }}>{t('common.newTicket')}</button>
                  <button onClick={handleClose} style={{ flex: 1, padding: 8, border: 'none', borderRadius: 8, background: 'var(--gradient)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>{t('common.close')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="support-btn"
        title={t('common.supportHelpTitle')}
      >
        {open ? <FiX size={24} /> : <FiHeadphones size={24} />}
      </button>
    </div>
  );
}