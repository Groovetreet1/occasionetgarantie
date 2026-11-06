import { useEffect, useRef, useState } from 'react';
import {
  FiUploadCloud, FiChevronDown, FiChevronUp, FiPlus, FiTrash2, FiSend,
  FiCheckCircle, FiAlertTriangle, FiUsers, FiInfo, FiDownload, FiFileText,
  FiX, FiClock, FiActivity, FiRefreshCw,
} from 'react-icons/fi';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const BRAND = 'Occasion & Garantie';
const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function keysIn(template) {
  const out = [];
  String(template || '').replace(PLACEHOLDER, (m, key) => {
    if (!out.includes(key)) out.push(key);
    return m;
  });
  return out;
}

function cell(row, column) {
  const v = row && row[column];
  return v == null ? '' : String(v).trim();
}

function render(template, row, variables) {
  const values = new Map(variables.map((v) => [v.key, cell(row, v.column)]));
  return String(template || '')
    .replace(PLACEHOLDER, (m, key) => (values.has(key) ? values.get(key) : m))
    .trim();
}

function branded(message) {
  const m = String(message || '').trim();
  if (!m) return '';
  if (m.toLowerCase().startsWith(BRAND.toLowerCase())) return m;
  return `${BRAND} : ${m}`;
}

function smsPartLimit(text) {
  // Les caracteres non-ASCII (arabe, emoji, accents) passent en Unicode 70.
  return /[^\u0000-\u007F]/.test(text) ? 70 : 160;
}

function Step({ n, title, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)',
          color: '#fff', fontSize: 12, fontWeight: 800,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {n}
        </span>
        <strong style={{ fontSize: 13.5 }}>{title}</strong>
      </div>
      {children}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 };
const helpStyle = { fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 };

export default function AdminSmsBulk({ enabled, onSent, notify }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [phoneColumn, setPhoneColumn] = useState('');
  const [variables, setVariables] = useState([{ key: 'var1', column: '' }]);
  const [template, setTemplate] = useState('');
  const [dedupe, setDedupe] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [polling, setPolling] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const flash = (type, text) => {
    if (typeof notify === 'function') notify(type, text);
  };

  const resetFile = () => {
    setFile(null);
    setParsed(null);
    setPhoneColumn('');
    setVariables([{ key: 'var1', column: '' }]);
    setTemplate('');
    setConfirmOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseFile = async (f) => {
    setError('');
    setResult(null);
    setProgress(null);
    setCampaign(null);
    const ext = String(f.name || '').split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setError(t('admin.smsBulkFileTypeErr'));
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError(t('admin.smsBulkFileSizeErr'));
      return;
    }
    setFile(f);
    setParsed(null);
    setParsing(true);
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await api.post('/admin/sms/bulk/parse', fd);
      const data = res.data || {};
      setParsed(data);
      const counts = data.phoneCounts || {};
      const headers = data.headers || [];
      const preferred = headers.find((h) => /tel|phone|gsm|mobile|num|whatsapp/i.test(h) && counts[h] > 0);
      if (preferred) {
        setPhoneColumn(preferred);
      } else {
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        setPhoneColumn(top && top[1] > 0 ? top[0] : '');
      }
      setVariables([{ key: 'var1', column: '' }]);
      setTemplate('');
    } catch (err) {
      setError(err?.response?.data?.message || t('admin.smsBulkParseErr'));
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) parseFile(f);
  };

  const downloadExample = () => {
    const csv = 'Nom complet,Telephone,Ville\nAhmed Exemple,0612345678,Casablanca\n';
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exemple-clients.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const addVariable = () => {
    const used = new Set(variables.map((v) => v.key));
    let n = 1;
    while (used.has(`var${n}`)) n += 1;
    setVariables((vars) => [...vars, { key: `var${n}`, column: '' }]);
  };

  const updateVariable = (index, patch) => {
    setVariables((vars) => vars.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  const removeVariable = (index) => {
    setVariables((vars) => vars.filter((_, i) => i !== index));
  };

  const insertPlaceholder = (key) => {
    const token = `{{${key}}}`;
    const el = textareaRef.current;
    if (!el) {
      setTemplate((v) => v + token);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? start;
    const next = template.slice(0, start) + token + template.slice(end);
    setTemplate(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const headers = parsed?.headers || [];
  const preview = parsed?.preview || [];
  const phoneCount = parsed?.phoneCounts?.[phoneColumn] || 0;
  const total = parsed?.total || 0;
  const limit = parsed?.limit || 300;
  const mappedVars = variables.filter((v) => v.key && v.column);
  const previewRendered = preview.slice(0, 3).map((row) => ({
    row,
    phone: cell(row, phoneColumn),
    message: branded(render(template, row, mappedVars)),
  }));
  const firstMessage = previewRendered.find((r) => r.message)?.message || branded(template);
  const charLimit = smsPartLimit(firstMessage);
  const parts = firstMessage ? Math.max(1, Math.ceil(firstMessage.length / charLimit)) : 0;

  const fetchProgress = async (c) => {
    if (!c || !c.startId || !c.endId) return null;
    const res = await api.get('/admin/sms/bulk/progress', { params: { startId: c.startId, endId: c.endId } });
    return res.data;
  };

  useEffect(() => {
    if (!campaign || !campaign.startId || !campaign.endId) {
      setPolling(false);
      return;
    }
    let stopped = false;
    setPolling(true);
    const tick = async () => {
      try {
        const data = await fetchProgress(campaign);
        if (!stopped && data) setProgress(data);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { stopped = true; clearInterval(id); setPolling(false); };
  }, [campaign]);

  useEffect(() => {
    if (!progress || !campaign) return;
    const remaining = (progress.total || 0) - (progress.done || 0);
    if (remaining <= 0) setPolling(false);
  }, [progress, campaign]);

  const openConfirm = () => {
    setError('');
    setResult(null);
    if (!file || !parsed) return setError(t('admin.smsBulkNeedFile'));
    if (!enabled) return setError(t('admin.smsBulkDisabled'));
    if (!phoneColumn) return setError(t('admin.smsBulkNeedPhone'));
    if (!template.trim()) return setError(t('admin.smsBulkNeedTemplate'));
    if (variables.some((v) => !v.key || !v.column)) return setError(t('admin.smsBulkMapAll'));
    const unmapped = keysIn(template).filter((k) => !variables.some((v) => v.key === k));
    if (unmapped.length) {
      return setError(t('admin.smsBulkUnmapped', { keys: unmapped.map((k) => `{{${k}}}`).join(', ') }));
    }
    if (!phoneCount) return setError(t('admin.smsBulkNoValid'));
    setConfirmOpen(true);
  };

  const send = async () => {
    setSending(true);
    setConfirmOpen(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('template', template);
      fd.append('phoneColumn', phoneColumn);
      fd.append('variables', JSON.stringify(mappedVars));
      fd.append('dedupe', dedupe ? '1' : '0');
      const res = await api.post('/admin/sms/bulk/send', fd);
      setResult(res.data);
      const c = res.data?.campaign;
      if (c && c.startId && c.endId) {
        setCampaign(c);
        try {
          const p = await fetchProgress(c);
          if (p) setProgress(p);
        } catch {}
      }
      flash('success', t('admin.smsBulkQueuedFlash', { count: res.data?.queued || 0 }));
      if (typeof onSent === 'function') onSent();
      resetFile();
    } catch (err) {
      const msg = err?.response?.data?.message || t('admin.smsBulkErr');
      setError(msg);
      flash('error', msg);
    } finally {
      setSending(false);
    }
  };

  const card = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 16, padding: 20,
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <FiUsers size={18} style={{ color: 'var(--primary)', marginTop: 2 }} />
          <div>
            <strong>{t('admin.smsBulkTitle')}</strong>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.6 }}>
              {t('admin.smsBulkDesc')}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={open ? 'btn btn-outline' : 'btn btn-primary'}
          style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {open ? t('admin.smsBulkClose') : t('admin.smsBulkOpen')}
          {open ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
        </button>
      </div>

      {!enabled && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px' }}>
          <FiAlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>{t('admin.smsBulkDisabled')}</span>
        </div>
      )}

      {open && (
        <div style={{ marginTop: 18, display: 'grid', gap: 22 }}>

          {error && (
            <div style={{ fontSize: 12.5, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '9px 12px' }}>
              {error}
            </div>
          )}

          {/* 1. Fichier */}
          <Step n="1" title={t('admin.smsBulkStepFile')}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              style={{
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
                background: dragging ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                transition: 'border-color .15s ease, background .15s ease',
              }}
            >
              <FiUploadCloud size={26} style={{ color: 'var(--primary)' }} />
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                {file ? file.name : t('admin.smsBulkChooseFile')}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                {parsing
                  ? t('admin.smsBulkParsing')
                  : file
                    ? `${(file.size / 1024).toFixed(0)} Ko`
                    : t('admin.smsBulkDrop')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {t('admin.smsBulkFileTypes')}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseFile(f);
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
              <button type="button" onClick={downloadExample} className="btn btn-ghost" style={{ fontSize: 11.5, padding: '4px 8px' }}>
                <FiDownload size={12} /> {t('admin.smsBulkExample')}
              </button>
              {file && (
                <button type="button" onClick={resetFile} className="btn btn-ghost" style={{ fontSize: 11.5, padding: '4px 8px' }}>
                  {t('admin.smsBulkRemoveFile')}
                </button>
              )}
            </div>

            {parsed && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('admin.smsBulkRows', { count: total })}
                </span>
                {total > limit && (
                  <span style={{ fontSize: 11.5, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '2px 8px' }}>
                    {t('admin.smsBulkLimit', { max: limit })}
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>·</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('admin.smsBulkColumns')} :</span>
                {headers.map((h) => (
                  <span key={h} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    {h} {parsed.phoneCounts?.[h] ? `(${parsed.phoneCounts[h]})` : ''}
                  </span>
                ))}
              </div>
            )}
          </Step>

          {parsed && (
            <>
              {/* 2. Correspondance */}
              <Step n="2" title={t('admin.smsBulkStepMap')}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>{t('admin.smsBulkPhoneColumn')}</label>
                    <select
                      value={phoneColumn}
                      onChange={(e) => setPhoneColumn(e.target.value)}
                      className="form-control"
                      style={{ width: '100%' }}
                    >
                      <option value="">{t('admin.smsBulkChooseColumn')}</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h} ({parsed.phoneCounts?.[h] || 0})</option>
                      ))}
                    </select>
                    <div style={helpStyle}>{t('admin.smsBulkPhoneHelp')}</div>
                  </div>
                  <div>
                    <label style={labelStyle}>{t('admin.smsBulkPhoneValid')}</label>
                    <div style={{ fontSize: 22, fontWeight: 800, color: phoneCount ? '#059669' : '#dc2626' }}>
                      {phoneCount}
                    </div>
                    <div style={helpStyle}>{t('admin.smsBulkPhoneFormats')}</div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={labelStyle}>{t('admin.smsBulkVars')}</label>
                  <div style={helpStyle}>{t('admin.smsBulkVarsHelp')}</div>
                  <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                    {variables.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 34px', gap: 8 }}>
                        <input
                          type="text"
                          value={v.key}
                          onChange={(e) => updateVariable(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                          placeholder="var1"
                          className="form-control"
                          style={{ width: '100%' }}
                          maxLength={30}
                        />
                        <select
                          value={v.column}
                          onChange={(e) => updateVariable(i, { column: e.target.value })}
                          className="form-control"
                          style={{ width: '100%' }}
                        >
                          <option value="">{t('admin.smsBulkChooseColumn')}</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeVariable(i)}
                          title={t('admin.smsBulkRemove')}
                          className="btn btn-ghost"
                          style={{ padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addVariable} className="btn btn-outline" style={{ fontSize: 12, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <FiPlus size={13} /> {t('admin.smsBulkAddVar')}
                  </button>
                </div>
              </Step>

              {/* 3. Message */}
              <Step n="3" title={t('admin.smsBulkStepMessage')}>
                <label style={labelStyle}>{t('admin.smsBulkTemplate')}</label>
                <textarea
                  ref={textareaRef}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  placeholder={t('admin.smsBulkTemplatePlaceholder')}
                  className="form-control"
                  style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{t('admin.smsBulkInsert')}</span>
                  {variables.filter((v) => v.key).map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertPlaceholder(v.key)}
                      style={{
                        fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
                        border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                        color: 'var(--primary)', cursor: 'pointer',
                      }}
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                  {variables.filter((v) => v.key).length === 0 && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                  <span style={helpStyle}>{t('admin.smsBulkBrandNote')}</span>
                  <span style={{ fontSize: 11.5, color: parts > 3 ? '#d97706' : 'var(--text-muted)' }}>
                    {t('admin.smsBulkChars', { count: firstMessage.length, parts })}
                  </span>
                </div>
              </Step>

              {/* Apercu */}
              {previewRendered.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <FiFileText size={15} style={{ color: 'var(--primary)' }} />
                    <strong style={{ fontSize: 13 }}>{t('admin.smsBulkPreview')}</strong>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {previewRendered.map(({ row, phone, message }) => (
                      <div key={row.__row} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, fontSize: 12, alignItems: 'start' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                          {phone || '—'}
                        </span>
                        <span style={{ color: message ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.55 }}>
                          {message || t('admin.smsBulkPreviewEmpty')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ ...helpStyle, marginTop: 8 }}>{t('admin.smsBulkPreviewNote')}</div>
                </div>
              )}

              {/* 4. Envoi */}
              <Step n="4" title={t('admin.smsBulkStepSend')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
                      {t('admin.smsBulkDedupe')}
                    </label>
                    <div style={helpStyle}>{t('admin.smsBulkMaxNote', { max: limit })}</div>
                  </div>
                  <button
                    type="button"
                    onClick={openConfirm}
                    className="btn btn-primary"
                    disabled={sending || !enabled || !phoneCount || !template.trim()}
                    style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 7, minHeight: 42 }}
                  >
                    <FiSend size={15} />
                    {sending ? t('admin.smsBulkSending') : t('admin.smsBulkSend', { count: phoneCount })}
                  </button>
                </div>
              </Step>

              {confirmOpen && (
                <div style={{ ...card, border: '1px solid var(--primary)', boxShadow: '0 10px 30px rgba(245,158,11,0.15)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#fffbeb', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FiAlertTriangle size={18} style={{ color: 'var(--primary)' }} />
                      </span>
                      <div>
                        <strong style={{ fontSize: 14 }}>{t('admin.smsBulkConfirmTitle')}</strong>
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.6 }}>
                          {t('admin.smsBulkConfirmBody', { count: phoneCount })}
                        </div>
                        <div style={{ marginTop: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, fontSize: 12 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            <span>{file?.name}</span>
                            <span>·</span>
                            <span>{phoneColumn}</span>
                            <span>·</span>
                            <span>{template.length} {t('admin.smsBulkChars', { count: template.length, parts }).split('·')[0]}</span>
                          </div>
                          <div style={{ marginTop: 6, color: 'var(--text)', lineHeight: 1.5 }}>{firstMessage}</div>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => setConfirmOpen(false)} className="btn btn-ghost" style={{ padding: 6 }} aria-label={t('admin.smsBulkClose')}>
                      <FiX size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <button type="button" onClick={() => setConfirmOpen(false)} className="btn btn-outline" style={{ fontSize: 12.5 }}>
                      {t('admin.smsBulkCancel')}
                    </button>
                    <button
                      type="button"
                      onClick={send}
                      disabled={sending}
                      className="btn btn-primary"
                      style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <FiSend size={13} /> {sending ? t('admin.smsBulkSending') : t('admin.smsBulkSend', { count: phoneCount })}
                    </button>
                  </div>
                </div>
              )}

              {(result || progress || campaign) && (
                <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    {polling ? (
                      <FiRefreshCw size={16} className="spin" style={{ color: 'var(--primary)' }} />
                    ) : (
                      <FiCheckCircle size={16} style={{ color: '#059669' }} />
                    )}
                    <strong style={{ fontSize: 13 }}>{t('admin.smsBulkProgressTitle')}</strong>
                    {polling && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressLive')}</span>}
                    {!polling && progress && (progress.done || 0) >= (progress.total || 0) && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669' }}>{t('admin.smsBulkProgressDone')}</span>
                    )}
                  </div>

                  {progress && progress.total > 0 ? (
                    <>
                      <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 999, overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ width: `${progress.percent || 0}%`, height: '100%', background: 'linear-gradient(135deg, var(--primary), #059669)', transition: 'width .4s ease' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 12 }}>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{progress.total}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressTotal')}</div>
                        </div>
                        <div style={{ background: '#fffbeb', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>{progress.pending || 0}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><FiClock size={11} /> {t('admin.smsBulkProgressPending')}</div>
                        </div>
                        <div style={{ background: '#eff6ff', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>{progress.sending || 0}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><FiActivity size={11} /> {t('admin.smsBulkProgressSending')}</div>
                        </div>
                        <div style={{ background: '#ecfdf5', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>{progress.sent || 0}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressSent')}</div>
                        </div>
                        <div style={{ background: '#fef2f2', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626' }}>{progress.failed || 0}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressFailed')}</div>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{progress.percent || 0}%</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressPercent')}</div>
                        </div>
                      </div>
                      {campaign && campaign.startId && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                          {t('admin.smsBulkProgressMeta', { from: campaign.startId, to: campaign.endId })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('admin.smsBulkProgressWaiting')}</div>
                  )}

                  {result && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={chip('#ecfdf5', '#059669', '#a7f3d0')}>{t('admin.smsBulkQueued', { count: result.queued || 0 })}</span>
                      {result.invalid > 0 && <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>{t('admin.smsBulkInvalid', { count: result.invalid })}</span>}
                      {result.duplicates > 0 && <span style={chip('#fffbeb', '#b45309', '#fde68a')}>{t('admin.smsBulkDuplicates', { count: result.duplicates })}</span>}
                      {result.empty > 0 && <span style={chip('#f8fafc', '#475569', '#e2e8f0')}>{t('admin.smsBulkEmpty', { count: result.empty })}</span>}
                      {result.tooLong > 0 && <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>{t('admin.smsBulkTooLong', { count: result.tooLong })}</span>}
                      {result.failed > 0 && <span style={chip('#fef2f2', '#dc2626', '#fecaca')}>{t('admin.smsBulkFailed', { count: result.failed })}</span>}
                    </div>
                  )}

                  {result && Array.isArray(result.errors) && result.errors.length > 0 && (
                    <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-secondary)' }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{t('admin.smsBulkErrorRows')}</div>
                      {result.errors.map((e, i) => (
                        <div key={i}>{t('admin.smsBulkRowN', { row: e.row, reason: e.reason })}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11.5, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <FiInfo size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{t('admin.smsBulkFooter')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function chip(bg, color, border) {
  return {
    fontSize: 11.5, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
    background: bg, color, border: `1px solid ${border}`,
  };
}
