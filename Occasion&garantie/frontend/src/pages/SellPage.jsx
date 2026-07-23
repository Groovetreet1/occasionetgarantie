import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSmartphone, FiDollarSign, FiShield, FiUsers, FiCheckCircle, FiArrowRight, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function SellPage() {
  const { user } = useAuth();

  return (
    <motion.div initial="hidden" animate="show" className="sell-page">
      {/* Hero */}
      <section className="sell-hero">
        <div className="container">
          <motion.div className="sell-hero-content" variants={fadeUp}>
            <h1>Vendez votre téléphone <span className="gradient-text">en toute simplicité</span></h1>
            <p>Créez votre compte vendeur, publiez vos annonces et trouvez des acheteurs rapidement. Zero commission.</p>
            {user ? (
              <Link to="/seller" className="btn btn-primary btn-lg">
                Mon Tableau de Bord <FiArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
                Créer mon compte vendeur <FiArrowRight size={18} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <motion.section className="section" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2 className="section-title text-center">Comment ça marche ?</h2>
          <p className="section-subtitle text-center">Vendez votre téléphone en 3 étapes</p>
          <motion.div className="steps-grid" variants={stagger}>
            {[
              { step: '1', icon: FiUsers, title: 'Créez votre compte', desc: 'Inscrivez-vous en tant que vendeur. C\'est gratuit et sans engagement.' },
              { step: '2', icon: FiCamera, title: 'Publiez votre annonce', desc: 'Ajoutez photos, description et prix de vente de votre téléphone.' },
              { step: '3', icon: FiDollarSign, title: 'Vendez et encaissez', desc: 'Un acheteur réserve votre produit, vous confirmez et la vente est faite.' },
            ].map((s) => (
              <motion.div key={s.step} className="step-card" variants={fadeUp}>
                <div className="step-number">{s.step}</div>
                <div className="step-icon"><s.icon size={24} /></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits */}
      <motion.section className="section sell-benefits" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2 className="section-title text-center">Pourquoi vendre chez nous ?</h2>
          <motion.div className="benefits-grid" variants={stagger}>
            {[
              { icon: FiTrendingUp, title: 'Gratuit', desc: 'Pas de frais d\'inscription ni de commission. Vous gardez 100% du prix de vente.' },
              { icon: FiShield, title: 'Paiement sécurisé', desc: 'L\'acheteur verse un acompte par virement, vous êtes payé à la confirmation.' },
              { icon: FiSmartphone, title: 'Audience ciblée', desc: 'Des milliers d\'acheteurs à la recherche de téléphones d\'occasion de qualité.' },
            ].map((b) => (
              <motion.div key={b.title} className="benefit-card" variants={fadeUp}>
                <div className="benefit-icon"><b.icon size={24} /></div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section className="sell-cta" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
        <div className="container">
          <h2>Prêt à vendre votre téléphone ?</h2>
          <p>Rejoignez notre communauté de vendeurs dès aujourd'hui.</p>
          {user ? (
            <Link to="/seller" className="btn btn-primary btn-lg">
              Aller au tableau de bord <FiArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/signup?role=seller" className="btn btn-primary btn-lg">
              Commencer à vendre <FiArrowRight size={18} />
            </Link>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
