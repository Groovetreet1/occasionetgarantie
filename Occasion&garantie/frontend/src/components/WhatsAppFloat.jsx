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
    <div className="whatsapp-float">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="scroll-top-btn"
        style={{ display: showScroll ? 'flex' : 'none' }}
        title="Retour en haut"
      >
        <FiArrowUp size={22} />
      </button>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
        title="Questions ? Contactez-nous sur WhatsApp"
      >
        <BsWhatsapp />
      </a>
    </div>
  );
}
