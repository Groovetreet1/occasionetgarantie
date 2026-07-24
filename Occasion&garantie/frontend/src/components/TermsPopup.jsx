import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck, FiAlertTriangle, FiShield, FiFileText } from 'react-icons/fi';

const sections = [
  {
    title: '1. Objet',
    content: 'Les presentes Conditions Generales regissent l\'utilisation de la plateforme Occasion & Garantie (www.occasionetgarantie.store), marketplace mettant en relation des vendeurs et des acheteurs de produits technologiques reconditionnes au Maroc.',
  },
  {
    title: '2. Role de la plateforme',
    content: 'Occasion & Garantie est une simple plateforme de mise en relation. Elle n\'est ni vendeur ni acheteur et ne detient aucun produit. Le site n\'est pas partie aux contrats conclus entre vendeurs et acheteurs et decline toute responsabilite en cas de litige commercial, defaut de paiement, non-livraison, ou non-conformite du produit.',
  },
  {
    title: '3. Responsabilite du vendeur',
    content: 'Le vendeur est seul responsable de la conformite, de la qualite, et de la description du produit mis en vente. Il garantit que le produit est conforme aux informations fournies et s\'engage a honorer toute garantie mentionnee dans l\'annonce. Tout manquement engage sa responsabilite civile et/ou penale. En cas de fraude, tromperie, ou non-respect de la garantie annoncee, le vendeur s\'expose a des poursuites judiciaires. Le site se reserve le droit de suspendre ou de bannir tout vendeur en cas de manquement grave.',
  },
  {
    title: '4. Garantie',
    content: 'Toute garantie mentionnee dans une annonce (duree, etendue) engage uniquement le vendeur. Occasion & Garantie n\'offre aucune garantie sur les produits et n\'est pas tenu de les verifier physiquement. En cas de defaut couvert par la garantie du vendeur, l\'acheteur doit contacter directement le vendeur. Si le vendeur ne respecte pas son engagement de garantie apres confirmation, il pourra etre poursuivi par les voies legales.',
  },
  {
    title: '5. Responsabilite de l\'acheteur',
    content: 'L\'acheteur reconnait avoir pris connaissance des caracteristiques du produit avant tout achat. Il est tenu de verifier le produit a la reception et de signaler tout defaut au vendeur dans un delai raisonnable. L\'acheteur s\'engage a ne pas utiliser la plateforme pour des transactions frauduleuses.',
  },
  {
    title: '6. Paiement et reservation',
    content: 'Le paiement s\'effectue en especes ou par virement bancaire directement entre l\'acheteur et le vendeur. Occasion & Garantie ne gere aucun flux financier et n\'est pas responsable des transactions. La reservation d\'un produit via la plateforme est un engagement d\'achat.',
  },
  {
    title: '7. Litiges',
    content: 'En cas de litige entre un vendeur et un acheteur, Occasion & Garantie peut servir de mediateur de bonne foi mais n\'est tenu a aucune obligation de resultat. Tout litige non resolue sera soumis aux tribunaux competents du Maroc. Le site decline toute responsabilite pour tout dommage direct ou indirect resultant de l\'utilisation de la plateforme.',
  },
  {
    title: '8. Donnees personnelles',
    content: 'Les donnees personnelles collectees sont utilisees uniquement dans le cadre du fonctionnement de la plateforme. Conformement a la loi 09-08 relative a la protection des donnees personnelles au Maroc, vous disposez d\'un droit d\'acces, de rectification et de suppression de vos donnees.',
  },
  {
    title: '9. Modification des conditions',
    content: 'Occasion & Garantie se reserve le droit de modifier les presentes conditions a tout moment. Les utilisateurs seront informes de tout changement significatif. L\'utilisation continue de la plateforme apres modification vaut acceptation des nouvelles conditions.',
  },
];

export default function TermsPopup({ open, onAccept, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="premium-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 2000 }}
        >
          <motion.div
            className="premium-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <button className="premium-close" onClick={onClose}><FiX size={20} /></button>

            <div style={{ padding: '28px 24px 0', textAlign: 'center' }}>
              <FiFileText size={32} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: 18, marginTop: 8 }}>Conditions Generales</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Lisez attentivement avant de creer votre compte</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {sections.map((s) => (
                <div key={s.title} style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiShield size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} /> {s.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{s.content}</p>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                En creant votre compte, vous reconnaissez avoir lu et accepte l'integralite des conditions ci-dessus.
              </div>
            </div>

            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)' }}>
              <button className="form-submit" onClick={onAccept} style={{ justifyContent: 'center', width: '100%' }}>
                <FiCheck size={16} /> J'accepte les conditions et je cree mon compte
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}