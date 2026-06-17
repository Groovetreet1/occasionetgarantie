import { useEffect, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';

const WHATSAPP_NUMBER = '212669017295';

export default function WhatsAppFloat() {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handle = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const msg = encodeURIComponent('Bonjour ! Bienvenue sur Occasion & Garantie. Comment puis-je vous aider ?');

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 999, alignItems: 'center' }}>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #EC4899)',
          border: 'none',
          color: 'white',
          display: showScroll ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)',
          cursor: 'pointer',
          transition: 'transform 0.3s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Retour en haut"
      >
        <FiArrowUp size={26} />
      </button>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.5)',
          transition: 'transform 0.3s',
          cursor: 'pointer',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Questions ? Contactez-nous sur WhatsApp"
      >
        <BsWhatsapp />
      </a>
    </div>
  );
}
