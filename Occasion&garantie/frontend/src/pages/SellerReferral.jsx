import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCopy, FiCheck, FiUsers, FiGift, FiLink, FiShield, FiUserCheck } from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import SellerNav from '../components/SellerNav';

const copyText = async (text) => {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); return true;
  }
};

export default function SellerReferral() {
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/seller/me/referrals')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onCopy = async () => {
    if (!data?.link) return;
    await copyText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="seller-page">
        <SellerNav />
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>...</div>
      </div>
    );
  }

  const referrals = data?.referrals || [];

  return (
    <div className="seller-page">
      <SellerNav />

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiGift size={22} color="#76A85A" /> {t('seller.referralTitle') || 'Parrainage'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {t('seller.referralSubtitle') || 'Invitez de nouveaux utilisateurs avec votre lien. Vous gagnez 100 crédits pour chaque inscription réalisée via votre parrainage.'}
        </p>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 18, border: '1px solid rgba(147,197,114,0.35)', background: 'linear-gradient(135deg, rgba(147,197,114,0.10), rgba(147,197,114,0.03))' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 240, flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><FiLink size={13} /> {t('seller.referralYourLink') || 'Votre lien de parrainage'}</div>
            <div style={{ fontWeight: 700, fontSize: 14, wordBreak: 'break-all', color: 'var(--text-primary)' }}>{data?.link}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>{t('nav.referralCode') || 'Votre code'} : <b style={{ color: '#76A85A' }}>{data?.code}</b></div>
          </div>
          <button onClick={onCopy} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            {copied ? <FiCheck size={16} /> : <FiCopy size={16} />} {copied ? (t('nav.referralCopied') || 'Lien copié !') : (t('seller.referralCopyLink') || 'Copier le lien')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}><FiUsers size={16} color="#76A85A" /> {t('seller.referralTotalSignups') || 'Inscriptions via votre lien'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{data?.total ?? 0}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13, marginBottom: 6 }}><FiGift size={16} color="#76A85A" /> {t('seller.referralCreditsEarned') || 'Crédits gagnés (parrainage)'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#76A85A' }}>{data?.totalCreditsEarned ?? 0} <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{t('seller.credits') || 'crédits'}</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>+{data?.rewardPerSignup ?? 100} {t('seller.credits') || 'crédits'} / inscription</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t('seller.referralListTitle') || 'Personnes inscrites via votre lien'}</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{referrals.length}</span>
        </div>
        {referrals.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>
            <FiUsers size={28} style={{ opacity: 0.35, marginBottom: 8 }} />
            <div>{t('seller.referralEmpty') || 'Aucune inscription pour le moment. Partagez votre lien pour commencer à gagner des crédits.'}</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>{t('seller.referralColUser') || 'Utilisateur'}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>{t('seller.referralColRole') || 'Type'}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>{t('seller.referralColDate') || 'Date'}</th>
                  <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '12px 16px', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)' }}>{t('seller.referralColStatus') || 'Statut'}</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(147,197,114,0.15)', color: '#76A85A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}><FiShield size={13} /></span>
                        {r.name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13 }}>{r.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: r.role === 'seller' ? 'rgba(147,197,114,0.15)' : 'rgba(100,116,139,0.12)', color: r.role === 'seller' ? '#5C8A43' : 'var(--text-secondary)' }}>
                        {r.role === 'seller' ? (t('seller.referralRoleSeller') || 'Vendeur') : (t('seller.referralRoleClient') || 'Client')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR') : '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.phone_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#059669', fontSize: 12, fontWeight: 600 }}><FiUserCheck size={14} /> {t('seller.referralVerified') || 'Vérifié'}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('seller.referralPending') || 'En attente'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        <FiShield size={12} style={{ verticalAlign: 'middle', marginInlineEnd: 6 }} />
        {t('seller.referralPrivacyNote') || 'Les noms et emails affichés sont partiellement masqués pour protéger la confidentialité.'}
      </div>
    </div>
  );
}
