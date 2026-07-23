import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMessageCircle, FiSend, FiArrowLeft, FiUser, FiStar, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Messenger() {
  const { id } = useParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [convLoading, setConvLoading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

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
      loadMessages();
      clearInterval(pollRef.current);
      pollRef.current = setInterval(loadMessages, 5000);
      setShowMobileList(false);
    }
    return () => clearInterval(pollRef.current);
  }, [activeConv]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
      setMessages(data);
    } catch {}
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText('');
    try {
      const { data } = await api.post(`/chat/conversations/${activeConv}/messages`, { text: msgText });
      setMessages((prev) => [...prev, data]);
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
              const lastMsg = c.last_message || 'Aucun message';
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
                    <div className="messenger-conv-name">
                      {convOtherName}
                      {c.product_name && <span className="messenger-conv-product"><FiShoppingBag size={10} /> {c.product_name}</span>}
                    </div>
                    <div className="messenger-conv-last">{lastMsg}</div>
                  </div>
                  {lastTime && <div className="messenger-conv-time">{lastTime}</div>}
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
          ) : convLoading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" /></div>
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
                    href={`https://wa.me/${otherPhone.replace(/^0+/, '')}?text=${waMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="messenger-wa-btn"
                    title="Contacter sur WhatsApp"
                  >
                    <BsWhatsapp size={18} />
                  </a>
                )}
              </div>

              <div className="messenger-messages">
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px', fontSize: '14px' }}>
                    Aucun message. Envoyez le premier message !
                  </div>
                ) : messages.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`messenger-msg ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="messenger-msg-text">{msg.text}</div>
                      <div className="messenger-msg-time">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="messenger-input-bar">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Écrivez un message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  className="messenger-input"
                />
                <button onClick={handleSend} disabled={!text.trim() || sending} className="messenger-send-btn">
                  <FiSend size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
