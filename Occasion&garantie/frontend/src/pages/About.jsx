import { Link } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiTruck, FiMapPin, FiPhone, FiMail, FiClock, FiCheckCircle, FiUsers, FiAward } from 'react-icons/fi';
import { BsWhatsapp } from 'react-icons/bs';

export default function About() {
  return (
    <>
      <section className="about-hero">
        <div className="container" style={{ textAlign: 'center', paddingTop: '120px', paddingBottom: '60px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px' }}>Qui sommes-nous ?</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
            Occasion & Garantie est votre destination de confiance pour l'achat de produits technologiques reconditionnés au Maroc.
          </p>
        </div>
      </section>

      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div className="about-grid">
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Notre histoire</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                Basés à Casablanca, nous sommes une équipe passionnée de technologie qui a compris qu'il est possible d'allier qualité et prix abordables.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
                Chaque produit que nous proposons est minutieusement vérifié, testé et garanti. Nous croyons que tout le monde mérite d'accéder aux meilleures technologies sans se ruiner.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                Notre mission est simple : vous offrir des produits d'exception à prix réduits, avec une garantie qui vous protège.
              </p>
            </div>
            <div className="about-stats-box">
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiUsers size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>+500</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clients satisfaits</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiAward size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>+3 ans</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>D'expérience</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiCheckCircle size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>100%</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Produits vérifiés</div>
              </div>
              <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)' }}>
                <FiTruck size={28} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>24h</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Livraison Casa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 0', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '40px' }}>Ce que nous offrons</h2>
          <div className="about-offer-grid">
            <div className="feature-card">
              <div className="feature-icon"><FiShield size={24} /></div>
              <h3>Garantie incluse</h3>
              <p>Chaque produit est couvert par une garantie minimum de 15 jours pour votre tranquillité.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiRefreshCw size={24} /></div>
              <h3>Testé et vérifié</h3>
              <p>Nos experts vérifient chaque article avant mise en vente. Qualité irréprochable.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><FiTruck size={24} /></div>
              <h3>Livraison rapide</h3>
              <p>Expédition sur Casablanca gratuit sous 24h. Suivi de commande en temps réel.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Contactez-nous</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Une question ? Besoin d'aide ? Nous sommes là pour vous.</p>
          </div>
          <div className="about-contact-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiMapPin size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Adresse</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Casablanca, Maroc</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiPhone size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Téléphone</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>+212 669-017295</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiMail size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Email</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>contact@occasion-garantie.fr</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                <FiClock size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Horaires</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Lun-Sam : 9h00 - 19h00</div>
                </div>
              </div>
              <a href="https://wa.me/212669017295?text=Bonjour%20!" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px', fontSize: '15px', gap: '8px' }}>
                <BsWhatsapp size={20} /> Nous écrire sur WhatsApp
              </a>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Envoyez-nous un message</h3>
              <input type="text" placeholder="Votre nom" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
              <input type="email" placeholder="Votre email" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }} />
              <textarea rows={4} placeholder="Votre message" style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
              <button className="btn btn-primary" style={{ justifyContent: 'center' }}>Envoyer</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
