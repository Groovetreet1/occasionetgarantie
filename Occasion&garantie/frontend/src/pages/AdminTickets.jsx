import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiHeadphones, FiSearch, FiClock, FiRefreshCw, FiSend, FiCheckCircle, FiMail, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const PER_PAGE = 10;

export default function AdminTickets() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [replies, setReplies] = useState({});
  const [sending, setSending] = useState({});
  const [sent, setSent] = useState({});
  const [pageNr, setPageNr] = useState(1);
  const [pageR, setPageR] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/contact/tickets')
      .then(res => setTickets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? tickets.filter(t =>
        t.ticket_number.includes(search) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const notRepliedAll = filtered.filter(t => !t.replied_at);
  const repliedAll = filtered.filter(t => t.replied_at);

  const notReplied = notRepliedAll.slice((pageNr - 1) * PER_PAGE, PER_PAGE * pageNr);
  const replied = repliedAll.slice((pageR - 1) * PER_PAGE, PER_PAGE * pageR);

  const totalNr = notRepliedAll.length;
  const totalR = repliedAll.length;
  const hasMoreNr = totalNr > PER_PAGE * pageNr;
  const hasMoreR = totalR > PER_PAGE * pageR;

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const handleReply = async (ticketNumber) => {
    const reply = replies[ticketNumber];
    if (!reply || !reply.trim()) return;
    setSending(prev => ({ ...prev, [ticketNumber]: true }));
    try {
      await api.post(`/contact/reply/${ticketNumber}`, { reply: reply.trim() });
      setSent(prev => ({ ...prev, [ticketNumber]: true }));
      setReplies(prev => ({ ...prev, [ticketNumber]: '' }));
      setTimeout(() => setSent(prev => ({ ...prev, [ticketNumber]: false })), 3000);
    } catch (err) {
      alert(err.response?.data?.message || t('admin.error'));
    } finally {
      setSending(prev => ({ ...prev, [ticketNumber]: false }));
    }
  };

  const Pagination = ({ page, setPage, hasMore, total }) => (
    total > PER_PAGE ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}
        >
          <FiChevronLeft size={14} /> {t('admin.previous')}
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '0 8px' }}>{t('admin.pageOf', { page, total: Math.ceil(total / PER_PAGE) })}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore}
          style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: !hasMore ? 0.4 : 1 }}
        >
          {t('admin.next')} <FiChevronRight size={14} />
        </button>
      </div>
    ) : null
  );

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> {t('admin.dashboardTitle')}</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiHeadphones size={28} style={{ color: 'var(--primary)' }} /> {t('admin.ticketsSupportTitle')}
            </h1>
          </div>
          <button onClick={load} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} disabled={loading}>
            <FiRefreshCw size={16} className={loading ? 'spin' : ''} /> {loading ? t('admin.loading') : t('admin.refresh')}
          </button>
        </div>

        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('admin.ticketsSearchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPageNr(1); setPageR(1); }}
            style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiHeadphones size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t('admin.noTickets')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {notRepliedAll.length > 0 && (
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} /> {t('admin.awaitingReply', { count: totalNr })}
                </h3>
                {notReplied.map(ticket => {
              const isOpen = expanded === ticket.id;
              return (
                <div key={ticket.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : ticket.id)}
                    style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', letterSpacing: '1px',
                        }}>
                          #{ticket.ticket_number}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{ticket.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiMail size={11} /> {ticket.email || t('admin.unknownEmail')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <FiClock size={12} /> {formatDate(ticket.created_at)}
                      </span>
                      {isOpen ? <FiChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <FiChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                        {ticket.message}
                      </div>

                      {sent[ticket.ticket_number] ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: 'var(--success)', fontSize: '14px' }}>
                          <FiCheckCircle size={18} /> {t('admin.replySent')}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            rows={3}
                            placeholder={t('admin.replyPlaceholder')}
                            value={replies[ticket.ticket_number] || ''}
                            onChange={(e) => setReplies(prev => ({ ...prev, [ticket.ticket_number]: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }}
                          />
                          <button
                            onClick={() => handleReply(ticket.ticket_number)}
                            disabled={sending[ticket.ticket_number] || !(replies[ticket.ticket_number] || '').trim()}
                            style={{ marginTop: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', background: 'var(--gradient)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {sending[ticket.ticket_number] ? t('admin.sending') : <><FiSend size={14} /> {t('admin.sendReply')}</>}
                          </button>
                          <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {t('admin.replyWillGoTo', { email: ticket.email })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
                <Pagination page={pageNr} setPage={setPageNr} hasMore={hasMoreNr} total={totalNr} />
              </div>
            )}
            {repliedAll.length > 0 && (
              <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} /> {t('admin.repliedSection', { count: totalR })}
                </h3>
                {replied.map(ticket => {
              const isOpen = expanded === ticket.id;
              return (
                <div key={ticket.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', overflow: 'hidden', opacity: 0.7,
                }}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : ticket.id)}
                    style={{ padding: '20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                          background: 'rgba(16,185,129,0.1)', color: 'var(--success)', letterSpacing: '1px',
                        }}>
                          #{ticket.ticket_number}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--success)' }}>
                          <FiCheckCircle size={12} /> {t('admin.repliedStatus')} {formatDate(ticket.replied_at)}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px' }}>{ticket.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiMail size={11} /> {ticket.email || t('admin.unknownEmail')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <FiClock size={12} /> {formatDate(ticket.created_at)}
                      </span>
                      {isOpen ? <FiChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <FiChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px' }}>
                      <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                        {ticket.message}
                      </div>
                      {sent[ticket.ticket_number] ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', color: 'var(--success)', fontSize: '14px' }}>
                          <FiCheckCircle size={18} /> {t('admin.replySent')}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            rows={3}
                            placeholder={t('admin.newReplyPlaceholder')}
                            value={replies[ticket.ticket_number] || ''}
                            onChange={(e) => setReplies(prev => ({ ...prev, [ticket.ticket_number]: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', minHeight: '60px' }}
                          />
                          <button
                            onClick={() => handleReply(ticket.ticket_number)}
                            disabled={sending[ticket.ticket_number] || !(replies[ticket.ticket_number] || '').trim()}
                            style={{ marginTop: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', background: 'var(--gradient)', color: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            {sending[ticket.ticket_number] ? t('admin.sending') : <><FiSend size={14} /> {t('admin.sendNewReply')}</>}
                          </button>
                          <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            {t('admin.replyWillGoTo', { email: ticket.email })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
                <Pagination page={pageR} setPage={setPageR} hasMore={hasMoreR} total={totalR} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
