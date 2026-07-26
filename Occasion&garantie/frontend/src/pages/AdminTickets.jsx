import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiHeadphones, FiSearch, FiCheck, FiClock } from 'react-icons/fi';
import api from '../api/axios';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/contact/tickets')
      .then(res => setTickets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? tickets.filter(t =>
        t.ticket_number.includes(search) ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.message.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  const formatDate = (d) => new Date(d).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}><FiArrowLeft /> Dashboard</Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiHeadphones size={28} style={{ color: 'var(--primary)' }} /> Tickets Support
            </h1>
          </div>
        </div>

        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <FiSearch size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Rechercher par numero ticket, nom ou message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FiHeadphones size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Aucun ticket pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(ticket => (
              <div key={ticket.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', letterSpacing: '1px',
                      marginBottom: '8px',
                    }}>
                      #{ticket.ticket_number}
                    </span>
                    <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>{ticket.name}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                    <FiClock size={12} /> {formatDate(ticket.created_at)}
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {ticket.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
