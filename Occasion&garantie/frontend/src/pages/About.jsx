import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiClock, FiCheckCircle, FiUsers, FiAward, FiSend, FiStar } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import GoMobileTicker from '../components/GoMobileTicker';

function yearsSince(dateStr, t) {
  const years = (new Date() - new Date(dateStr)) / (365.25 * 86400000);
  if (years < 1) return t('about.lessThanYear');
  return t('about.years', { years: Math.floor(years) });
}

export default function About() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [siteStats, setSiteStats] = useState(null);
  const [cfMsg, setCfMsg] = useState('');
  const [cfLoading, setCfLoading] = useState(false);
  const [cfDone, setCfDone] = useState(false);

  useEffect(() => {
    api.get('/public/stats').then(r => setSiteStats(r.data)).catch(() => {});
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!cfMsg.trim()) return;
    setCfLoading(true);
    try {
      await api.post('/contact', { message: cfMsg, name: (user?.fullName || user?.full_name || ''), email: user?.email });
      setCfDone(true);
      setCfMsg('');
    } catch (err) {
      const data = err.response?.data || {};
      alert((data.message || t('products.sendError') + '.') + (data.detail ? ` (${data.detail})` : ''));
    } finally { setCfLoading(false); }
  };

  return (
    <>
      <section className="about-hero">
        <div className="container" style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '60px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>{t('about.heroTitle')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
            {t('about.heroDesc')}
          </p>
        </div>
      </section>

      <GoMobileTicker />

      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="about-grid">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>{t('about.historyTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                {t('about.historyText1')}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                {t('about.historyText2')}
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {t('about.historyText3')}
              </p>
            </div>
            <div className="about-stats-box">
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiUsers size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>{siteStats ? `+${siteStats.totalUsers}` : '...'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('about.statMembers')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiAward size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>{yearsSince('2023-01-01', t)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('about.statExperience')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiCheckCircle size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>{siteStats ? `+${siteStats.totalProducts}` : '...'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('about.statAds')}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiStar size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>{siteStats ? `${siteStats.avgRating}/5` : '...'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('about.statSellerRating')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{t('about.teamTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('about.teamSubtitle')}</p>
          </div>
          <div className="about-team-grid">
            {[
              {
                name: 'Elmahfoudy Abdellah',
                roleKey: 'about.team1Role',
                flag: '🇲🇦',
                country: 'Maroc',
                img: '/team/abdellah.jpg',
                descKey: 'about.team1Desc',
              },
              {
                name: 'Najem-Eddine',
                roleKey: 'about.team2Role',
                flag: '🇩🇿',
                country: 'Algérie',
                img: '/team/najem.jpg',
                descKey: 'about.team2Desc',
              },
              {
                name: 'Elhamidy Mehdi',
                roleKey: 'about.team3Role',
                flag: '🇲🇦',
                country: 'Maroc',
                img: '/team/mehdi.jpg',
                descKey: 'about.team3Desc',
              },
            ].map((m) => (
              <div key={m.name} className="about-team-card">
                <div className="about-team-avatar">
                  {m.img ? <img src={m.img} alt={m.name} /> : <span>{m.name.split(' ').map(w => w[0]).join('')}</span>}
                </div>
                <h3>{m.name}</h3>
                <div className="about-team-role">{t(m.roleKey)}</div>
                <div className="about-team-country">{m.flag} {m.country}</div>
                <p>{t(m.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '40px' }}>{t('about.offerTitle')}</h2>
          <div className="about-offer-grid">
            <div className="feature-card">
              <div className="feature-icon"><FiCheckCircle size={24} /></div>
              <h3>{t('about.offerVerified')}</h3>
              <p>{t('about.offerVerifiedDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiStar size={24} /></div>
              <h3>{t('about.offerReviews')}</h3>
              <p>{t('about.offerReviewsDesc')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiUsers size={24} /></div>
              <h3>{t('about.offerTrust')}</h3>
              <p>{t('about.offerTrustDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{t('about.contactTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t('about.contactSubtitle')}</p>
          </div>
          <div className="about-contact-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiMapPin size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('about.contactAddress')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('about.contactAddressValue')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiPhone size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('about.contactPhone')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>+212 669-017295</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiMail size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('about.contactEmail')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>contact@contact.occasionetgarantie.store</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiClock size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{t('about.contactHours')}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('about.contactHoursValue')}</div>
                </div>
              </div>
              <a href="https://wa.me/212669017295?text=Bonjour%20!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px', fontSize: '15px', gap: '8px' }}>
                <BsWhatsapp size={20} /> {t('about.whatsapp')}
              </a>
            </div>
            <form onSubmit={handleContactSubmit} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{t('about.messageTitle')}</h3>
              {cfDone ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--success)' }}>
                  <FiSend size={32} style={{ marginBottom: '8px' }} />
                  <p>{t('about.messageSent')}</p>
                  <button type="button" className="btn btn-ghost" onClick={() => setCfDone(false)} style={{ marginTop: '8px' }}>{t('about.sendAnother')}</button>
                </div>
              ) : user ? (
                <>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '8px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    {t('about.sentFrom')} <strong>{user.fullName || user.full_name}</strong> &lt;{user.email}&gt;
                  </div>
                  <textarea rows={4} placeholder={t('about.messagePlaceholder')} value={cfMsg} onChange={e => setCfMsg(e.target.value)} required style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={cfLoading}>
                    {cfLoading ? t('about.sending') : t('about.send')}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  <p>{t('about.loginRequired')}</p>
                  <Link to="/login" className="btn btn-primary" style={{ marginTop: '12px', display: 'inline-flex' }}>{t('about.login')}</Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
