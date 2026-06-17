import { BsWhatsapp } from 'react-icons/bs';

const WHATSAPP_NUMBER = '212669017295';

export default function WhatsAppFloat() {
  const msg = encodeURIComponent('Bonjour ! Bienvenue sur Occasion & Garantie. Comment puis-je vous aider ?');
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
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
        zIndex: 999,
        transition: 'transform 0.3s',
        cursor: 'pointer',
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      title="Questions ? Contactez-nous sur WhatsApp"
    >
      <BsWhatsapp />
    </a>
  );
}
