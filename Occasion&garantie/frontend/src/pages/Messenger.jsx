import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMessageCircle, FiSend, FiArrowLeft, FiUser, FiStar, FiTrash2, FiShoppingBag, FiMic, FiX } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toWhatsAppNumber } from '../utils/media';
import AudioPlayer from '../components/AudioPlayer';

const MAX_AUDIO_SECONDS = 60;
const MEDIA_BASE = import.meta.env.VITE_API_URL || '';

export default function Messenger() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMobileList, setShowMobileList] = useState(true);
  const [typingName, setTypingName] = useState('');
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const justOpenedRef = useRef(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const prevMsgCountRef = useRef(0);
  const wasNearBottomRef = useRef(true);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordTimerRef = useRef(null);
  const recChunksRef = useRef([]);

  const audioSrc = (p) => p.startsWith('http') ? p : `${MEDIA_BASE}/uploads/${p}`;

  const scrollToBottom = (smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  useEffect(() => {
    loadConversations();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (id) {
      setActiveConv(id);
      setShowMobileList(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeConv) {
      justOpenedRef.current = true;
      loadMessages();
      checkTyping();
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        loadMessages();
        checkTyping();
      }, 3000);
      setShowMobileList(false);
    }
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => {
    if (justOpenedRef.current && messages.length > 0) {
      justOpenedRef.current = false;
      scrollToBottom(false);
    } else if (messages.length > prevMsgCountRef.current && wasNearBottomRef.current) {
      scrollToBottom(true);
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);
    } catch {} finally { setLoading(false); }
  };

  const loadMessages = async () => {
    if (!activeConv) return;
    try {
      const { data } = await api.get(`/chat/conversations/${activeConv}/messages`);
      if (data.length > prevMsgCountRef.current) {
        wasNearBottomRef.current = isNearBottom();
        setMessages(data);
      } else if (isNearBottom()) {
        setMessages(data);
      }
    } catch {}
  };

  const checkTyping = async () => {
    if (!activeConv) return;
    try {
      const { data } = await api.get(`/chat/conversations/${activeConv}/typing`);
      if (data.typing && data.userId !== user?.id) {
        setTypingName(data.name);
      } else {
        setTypingName('');
      }
    } catch {}
  };

  const sendTyping = async () => {
    if (!activeConv) return;
    try {
      await api.post(`/chat/conversations/${activeConv}/typing`);
    } catch {}
  };

  const handleInputChange = (e) => {
    if (e.target.value.length > 100) return;
    setText(e.target.value);
    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(sendTyping, 300);
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    const wasNearBottom = isNearBottom();
    wasNearBottomRef.current = wasNearBottom;
    const msgText = text.trim();
    setText('');
    try {
      const { data } = await api.post(`/chat/conversations/${activeConv}/messages`, { text: msgText });
      prevMsgCountRef.current++;
      setMessages((prev) => [...prev, data]);
      if (wasNearBottom) setTimeout(scrollToBottom, 100);
      loadConversations();
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setText(msgText);
      alert(err.response?.data?.message || 'Erreur');
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const cleanupRecorder = () => {
    clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    mediaRecorderRef.current = null;
    recChunksRef.current = [];
  };

  const stopRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.stop();
    } else {
      cleanupRecorder();
      setRecording(false);
    }
  };

  const startRecording = async () => {
    if (!activeConv) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Votre navigateur ne supporte pas l\'enregistrement audio.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t));

      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) recChunksRef.current.push(e.data); };
      rec.onstop = () => {
        const type = rec.mimeType || 'audio/webm';
        const blob = new Blob(recChunksRef.current, { type });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecordedDuration(recTime);
        cleanupRecorder();
        setRecording(false);
      };
      mediaRecorderRef.current = rec;
      mediaStreamRef.current = stream;
      rec.start();
      setRecording(true);
      setRecTime(0);
      setRecordedBlob(null);
      setRecordedUrl('');
      setRecordedDuration(0);
      recordTimerRef.current = setInterval(() => {
        setRecTime((t) => {
          if (t + 1 >= MAX_AUDIO_SECONDS) {
            stopRecording();
            return MAX_AUDIO_SECONDS;
          }
          return t + 1;
        });
      }, 1000);
    } catch (e) {
      alert('Accès au micro refusé ou indisponible.');
    }
  };

  const cancelRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      rec.onstop = () => {
        cleanupRecorder();
        setRecording(false);
      };
      rec.stop();
    } else {
      cleanupRecorder();
      setRecording(false);
    }
    setRecordedBlob(null);
    setRecordedUrl('');
    setRecordedDuration(0);
    setRecTime(0);
  };

  const sendAudio = async () => {
    if (!recordedBlob || !activeConv || sendingAudio) return;
    setSendingAudio(true);
    const wasNearBottom = isNearBottom();
    wasNearBottomRef.current = wasNearBottom;
    const fd = new FormData();
    const ext = recordedBlob.type.includes('mp4') ? 'm4a' : 'webm';
    fd.append('audio', recordedBlob, `voix.${ext}`);
    fd.append('duration', String(recordedDuration));
    try {
      const { data } = await api.post(`/chat/conversations/${activeConv}/audio`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      prevMsgCountRef.current++;
      setMessages((prev) => [...prev, data]);
      if (wasNearBottom) setTimeout(scrollToBottom, 100);
      loadConversations();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedBlob(null);
      setRecordedUrl('');
      setRecordedDuration(0);
      setRecTime(0);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'envoi du message vocal');
    } finally { setSendingAudio(false); }
  };

  useEffect(() => () => cleanupRecorder(), []);

  const handleDeleteConv = async (convId) => {
    try {
      await api.delete(`/chat/conversations/${convId}`);
      setConversations((prev) => prev.filter(c => c.id !== convId));
      if (Number(activeConv) === convId) {
        setActiveConv(null);
        setMessages([]);
        setShowMobileList(true);
      }
      setDeleteTarget(null);
    } catch (err) {
      setDeleteTarget(null);
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const conv = conversations.find(c => c.id === Number(activeConv));
  const isSeller = conv && user && conv.seller_id === user.id;
  const otherName = conv ? (isSeller ? conv.buyer_name : conv.seller_name) : '';
  const otherPhone = conv ? (isSeller ? conv.buyer_phone : conv.seller_phone) : '';
  const waMsg = otherPhone ? encodeURIComponent(`Bonjour ! Vous avez un message de ${user?.full_name || user?.fullName} sur Occasion & Garantie.`) : '';

  return (
    <section className="messenger-page">
      <div className="messenger-container">
        <div className={`messenger-sidebar ${showMobileList ? '' : 'messenger-hide-mobile'}`}>
          <div className="messenger-sidebar-header">
            <h2><FiMessageCircle size={18} /> Messages</h2>
          </div>
          <div className="messenger-conv-list">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" /></div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                <FiMessageCircle size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                <p>Aucune conversation</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Contactez un vendeur depuis un produit</p>
              </div>
            ) : conversations.map((c) => {
              const isActive = Number(activeConv) === c.id;
              const lastTime = c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';
              const convOtherName = user && c.seller_id === user.id ? c.buyer_name : c.seller_name;
              return (
                <div
                  key={c.id}
                  className={`messenger-conv-item${isActive ? ' active' : ''}`}
                  onClick={() => setActiveConv(c.id)}
                >
                  <div className="messenger-conv-avatar"><FiUser size={18} /></div>
                  <div className="messenger-conv-info">
                    <div className="messenger-conv-name">{convOtherName}</div>
                    {c.product_name && <div className="messenger-conv-product"><FiShoppingBag size={11} /> {c.product_name}</div>}
                  </div>
                  <div className="messenger-conv-side">
                    {lastTime && <div className="messenger-conv-time">{lastTime}</div>}
                    <button
                      className="messenger-conv-delete"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.id); }}
                      title="Supprimer la conversation"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`messenger-main ${showMobileList ? 'messenger-hide-mobile' : ''}`}>
          {!activeConv ? (
            <div className="messenger-empty">
              <FiMessageCircle size={48} />
              <h3>Vos messages</h3>
              <p>Sélectionnez une conversation ou contactez un vendeur depuis un produit.</p>
              <Link to="/products" className="btn btn-primary" style={{ marginTop: '12px' }}>
                <FiShoppingBag size={16} /> Voir les produits
              </Link>
            </div>
          ) : (
            <>
              <div className="messenger-chat-header">
                <button className="messenger-back-btn" onClick={() => setShowMobileList(true)}>
                  <FiArrowLeft size={20} />
                </button>
                <div className="messenger-chat-user">
                  <div className="messenger-chat-avatar"><FiUser size={18} /></div>
                  <div>
                    <strong>{otherName}</strong>
                    {conv?.product_name && <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>{conv.product_name}</span>}
                  </div>
                </div>
                {otherPhone && (
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(otherPhone)}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="messenger-wa-btn"
                    title="Contacter sur WhatsApp"
                  >
                    <BsWhatsapp size={18} />
                  </a>
                )}
              </div>

              <div className="messenger-messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '14px' }}>
                    Aucun message. Envoyez le premier message !
                  </div>
                ) : messages.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  if (msg.audio) {
                    return (
                      <div key={msg.id} className={`messenger-msg ${isMine ? 'mine' : 'theirs'} messenger-msg-audio`}>
                        <AudioPlayer src={audioSrc(msg.audio)} duration={msg.duration} />
                        <div className="messenger-msg-time">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    );
                  }
                  const isExpanded = !!expandedMsgs[msg.id];
                  const isLong = msg.text.length > 20;
                  const shownText = isLong && !isExpanded ? msg.text.slice(0, 20) + '…' : msg.text;
                  return (
                    <div key={msg.id} className={`messenger-msg ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="messenger-msg-text">{shownText}</div>
                      {isLong && (
                        <button
                          onClick={() => setExpandedMsgs(s => ({ ...s, [msg.id]: !s[msg.id] }))}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0',
                            fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font)',
                            textDecoration: 'underline',
                            color: isMine ? 'rgba(255,255,255,0.85)' : 'var(--primary)',
                          }}
                        >
                          {isExpanded ? 'Afficher moins' : 'Afficher la suite'}
                        </button>
                      )}
                      <div className="messenger-msg-time">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
                {typingName && (
                  <div className="messenger-msg theirs messenger-typing">
                    <div className="messenger-msg-text"><em>{typingName}</em> écrit...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="messenger-input-bar">
                {recording ? (
                  <div className="messenger-recording">
                    <div className="messenger-rec-dot" />
                    <span className="messenger-rec-timer">0:{String(recTime).padStart(2, '0')}</span>
                    <span className="messenger-rec-hint">Enregistrement…</span>
                    <button onClick={stopRecording} className="messenger-rec-stop" title="Arrêter et envoyer">
                      <FiSend size={16} />
                    </button>
                    <button onClick={cancelRecording} className="messenger-rec-cancel" title="Annuler">
                      <FiX size={16} />
                    </button>
                  </div>
                ) : recordedBlob ? (
                  <div className="messenger-recording">
                    <div className="messenger-preview-audio">
                      <AudioPlayer src={recordedUrl} duration={recordedDuration} size="preview" />
                    </div>
                    <button onClick={sendAudio} disabled={sendingAudio} className="messenger-rec-stop" title="Envoyer">
                      <FiSend size={16} />
                    </button>
                    <button onClick={cancelRecording} className="messenger-rec-cancel" title="Supprimer">
                      <FiX size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Écrivez un message..."
                      value={text}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      disabled={sending}
                      maxLength={100}
                      className="messenger-input"
                    />
                    <button onClick={startRecording} disabled={sending} className="messenger-mic-btn" title="Message vocal (max 60s)">
                      <FiMic size={18} />
                    </button>
                    <button onClick={handleSend} disabled={!text.trim() || sending} className="messenger-send-btn">
                      <FiSend size={18} />
                    </button>
                  </>
                )}
              </div>
              <div style={{ textAlign: 'right', padding: '2px 20px 8px', fontSize: 11, color: 'var(--text-muted)' }}>{text.length}/100</div>
            </>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="messenger-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="messenger-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="messenger-confirm-icon"><FiTrash2 size={26} /></div>
            <h3>Supprimer la conversation ?</h3>
            <p>Cette conversation et tous ses messages seront supprimés définitivement. Cette action est irréversible.</p>
            <div className="messenger-confirm-actions">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Annuler</button>
              <button className="messenger-confirm-delete-btn" onClick={() => handleDeleteConv(deleteTarget)}>
                <FiTrash2 size={15} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}