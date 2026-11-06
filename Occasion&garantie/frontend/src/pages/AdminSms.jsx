import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMessageSquare, FiRefreshCw, FiSmartphone, FiSend,
  FiCheckCircle, FiAlertTriangle, FiClock, FiWifi, FiWifiOff, FiMail,
} from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

function fmtDate(d) {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('fr-FR');
  } catch {
    return '-';
  }
}

function statusColor(status) {
  if (status === 'sent') return '#059669';
  if (status === 'failed') return '#dc2626';
  if (status === 'sending') return '#2563eb';
  return '#d97706';
}

function statusIcon(status) {
  if (status === 'sent') return FiCheckCircle;
  if (status === 'failed') return FiAlertTriangle;
  if (status === 'sending') return FiSend;
  return FiClock;
}

function Toggle({ checked, onChange, disabled, saving }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled || saving}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', width: 56, height: 30, borderRadius: 999,
        border: 'none', cursor: disabled || saving ? 'not-allowed' : 'pointer',
        background: checked ? '#059669' : '#94a3b8',
        opacity: disabled ? 0.45 : 1,
        transition: 'background .2s ease',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 29 : 3,
        width: 24, height: 24, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,.25)', transition: 'left .2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 800, color: checked ? '#059669' : '#64748b',
      }}>
        {checked ? '✓' : '×'}
      </span>
    </button>
  );
}

export default function AdminSms() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [notice, setNotice] = useState(null);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const flash = useCallback((type, text) => {
    setNotice({ type, text });
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, []);

  const load = useCallback(async (silent) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const [settingsRes, queueRes] = await Promise.all([
        api.get('/admin/sms/settings'),
        api.get('/admin/sms/queue'),
      ]);
      setData(settingsRes.data);
      setRecent(queueRes.data.recent || []);
    } catch (err) {
      if (!silent) flash('error', err?.response?.data?.message || t('admin.smsError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [flash, t]);

  useEffect(() => {
    load(false);
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [load]);

  const save = async (patch) => {
    const key = Object.keys(patch)[0];
    setSavingKey(key);
    try {
      const res = await api.put('/admin/sms/settings', patch);
      setData((d) => ({ ...d, ...res.data }));
      flash('success', t('admin.smsSaved'));
    } catch (err) {
      flash('error', err?.response?.data?.message || t('admin.smsError'));
    } finally {
      setSavingKey('');
    }
  };

  const sendTest = async (e) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setSendingTest(true);
    try {
      const res = await api.post('/admin/sms/test', {
        phone: testPhone.trim(),
        message: testMessage.trim() || undefined,
      });
      flash('success', t('admin.smsTestQueued', { id: res.data.id }));
      setTestMessage('');
      load(true);
    } catch (err) {
      flash('error', err?.response?.data?.message || t('admin.smsError'));
    } finally {
      setSendingTest(false);
    }
  };

  const card = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20,
  };

  const smsEnabled = !!data?.sms_enabled;
  const otpEnabled = !!data?.otp_sms_enabled;
  const stats = data?.stats || { counts: { pending: 0, sending: 0, sent: 0, failed: 0 } };
  const counts = stats.counts || {};
  const device = stats.lastDevice;
  const online = device?.lastSeen
    ? Date.now() - new Date(device.lastSeen).getTime() < 5 * 60 * 1000
    : false;
  const provider = data?.provider || '-';
  const isGateway = provider === 'gateway';

  return (
    <section className="admin-dashboard">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <Link to="/admin" className="btn btn-ghost" style={{ marginBottom: '8px' }}>
              <FiArrowLeft /> {t('admin.dashboardTitle')}
            </Link>
            <h1 style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiMessageSquare size={28} style={{ color: 'var(--primary)' }} /> {t('admin.smsTitle')}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              {t('admin.smsSubtitle')}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={refreshing} className="btn btn-outline" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiRefreshCw size={14} className={refreshing ? 'spin' : ''} /> {t('admin.refresh')}
          </button>
        </div>

        {notice && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: notice.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: notice.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}>
            {notice.text}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>

            {/* Interrupteurs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <FiMessageSquare size={18} style={{ color: 'var(--primary)' }} />
                      <strong>{t('admin.smsGlobal')}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {t('admin.smsGlobalDesc')}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: smsEnabled ? '#059669' : '#dc2626' }}>
                      {smsEnabled ? t('admin.smsOn') : t('admin.smsOff')}
                    </div>
                  </div>
                  <Toggle
                    checked={smsEnabled}
                    saving={savingKey === 'sms_enabled'}
                    onChange={(v) => save({ sms_enabled: v })}
                  />
                </div>
                {!smsEnabled && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
                    <FiMail size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{t('admin.smsGlobalOffHint')}</span>
                  </div>
                )}
              </div>

              <div style={{ ...card, opacity: smsEnabled ? 1 : 0.7 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <FiMail size={18} style={{ color: '#2563eb' }} />
                      <strong>{t('admin.smsOtp')}</strong>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {t('admin.smsOtpDesc')}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: otpEnabled && smsEnabled ? '#059669' : '#dc2626' }}>
                      {otpEnabled && smsEnabled ? t('admin.smsOn') : t('admin.smsOff')}
                    </div>
                  </div>
                  <Toggle
                    checked={otpEnabled && smsEnabled}
                    disabled={!smsEnabled}
                    saving={savingKey === 'otp_sms_enabled'}
                    onChange={(v) => save({ otp_sms_enabled: v })}
                  />
                </div>
                {smsEnabled && !otpEnabled && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
                    <FiMail size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{t('admin.smsOtpOffHint')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Statut passerelle */}
            <div style={{ ...card }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FiSmartphone size={18} style={{ color: 'var(--primary)' }} />
                <strong>{t('admin.smsStatus')}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('admin.smsProvider')}</div>
                  <div style={{ fontWeight: 700 }}>
                    {isGateway ? t('admin.smsProviderGateway') : provider}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('admin.smsPhone')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    {online ? <FiWifi size={15} style={{ color: '#059669' }} /> : <FiWifiOff size={15} style={{ color: '#dc2626' }} />}
                    <span>{device?.id || t('admin.smsNoDevice')}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: online ? '#ecfdf5' : '#fef2f2', color: online ? '#059669' : '#dc2626' }}>
                      {online ? t('admin.smsOnline') : t('admin.smsOffline')}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t('admin.smsLastSeen', { at: fmtDate(device?.lastSeen) })}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{t('admin.smsQueue')}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['pending', 'sending', 'sent', 'failed'].map((s) => (
                      <span key={s} style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: statusColor(s) }}>
                        {counts[s] || 0} {t(`admin.smsStatus${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Test d'envoi */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <FiSend size={18} style={{ color: 'var(--primary)' }} />
                <strong>{t('admin.smsTest')}</strong>
              </div>
              <form onSubmit={sendTest} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px', minWidth: 180 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    {t('admin.smsTestPhone')}
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="06XXXXXXXX"
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: '2 1 280px', minWidth: 200 }}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
                    {t('admin.smsTestMessage')}
                  </label>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder={t('admin.smsTestPlaceholder')}
                    className="form-control"
                    style={{ width: '100%' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={sendingTest || !testPhone.trim() || !smsEnabled}
                  style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, minHeight: 40 }}
                >
                  <FiSend size={14} /> {sendingTest ? t('admin.smsSending') : t('admin.smsSend')}
                </button>
              </form>
              {!smsEnabled && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#92400e' }}>
                  {t('admin.smsTestDisabled')}
                </div>
              )}
            </div>

            {/* Historique */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiClock size={18} style={{ color: 'var(--primary)' }} />
                  <strong>{t('admin.smsRecent')}</strong>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('admin.smsAutoRefresh')}</span>
              </div>
              {recent.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '18px 0', textAlign: 'center' }}>
                  {t('admin.smsNoMessages')}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 6px', fontWeight: 600 }}>#</th>
                        <th style={{ padding: '8px 6px', fontWeight: 600 }}>{t('admin.smsColPhone')}</th>
                        <th style={{ padding: '8px 6px', fontWeight: 600 }}>{t('admin.smsColMessage')}</th>
                        <th style={{ padding: '8px 6px', fontWeight: 600 }}>{t('admin.smsColStatus')}</th>
                        <th style={{ padding: '8px 6px', fontWeight: 600 }}>{t('admin.smsColDate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((row) => {
                        const Icon = statusIcon(row.status);
                        return (
                          <tr key={row.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '9px 6px', color: 'var(--text-muted)' }}>{row.id}</td>
                            <td style={{ padding: '9px 6px', whiteSpace: 'nowrap', fontWeight: 600 }}>{row.phone}</td>
                            <td style={{ padding: '9px 6px', maxWidth: 360 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.message}>
                                {row.message}
                              </div>
                              {row.error && (
                                <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.error}>
                                  {row.error}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '9px 6px', whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, color: statusColor(row.status) }}>
                                <Icon size={13} /> {t(`admin.smsStatus${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}`)}
                              </span>
                              {row.attempts > 0 && (
                                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 6 }}>×{row.attempts}</span>
                              )}
                            </td>
                            <td style={{ padding: '9px 6px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                              {fmtDate(row.sent_at || row.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
