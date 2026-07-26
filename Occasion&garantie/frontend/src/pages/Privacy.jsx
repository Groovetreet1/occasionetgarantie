import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Privacy() {
  useEffect(() => { document.title = 'Politique de confidentialité - Occasion & Garantie'; }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="container legal-page">
        <Link to="/" className="back-link"><FiArrowLeft size={14} /> Retour à l'accueil</Link>
        <h1>Politique de confidentialité</h1>
        <p className="legal-date">Dernière mise à jour : juillet 2026</p>

        <section>
          <h2>1. Collecte des données</h2>
          <p>Nous collectons les données suivantes lorsque vous utilisez notre plateforme :</p>
          <ul>
            <li>Nom et prénom</li>
            <li>Adresse email</li>
            <li>Numéro de téléphone</li>
            <li>Photos et descriptions de produits</li>
            <li>Données de navigation (cookies, pages visitées)</li>
          </ul>
        </section>

        <section>
          <h2>2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Créer et gérer votre compte</li>
            <li>Publier et gérer vos annonces</li>
            <li>Vous contacter suite à une réservation ou un achat</li>
            <li>Améliorer notre plateforme et votre expérience utilisateur</li>
            <li>Vous envoyer des notifications importantes</li>
          </ul>
        </section>

        <section>
          <h2>3. Cookies</h2>
          <p>Nous utilisons des cookies pour :</p>
          <ul>
            <li>Assurer le fonctionnement de la plateforme (cookies techniques)</li>
            <li>Analyser l'audience et améliorer nos services</li>
            <li>Afficher des publicités adaptées via Google AdSense</li>
          </ul>
          <p>En utilisant notre site, vous consentez à l'utilisation de ces cookies.</p>
        </section>

        <section>
          <h2>4. Partage des données</h2>
          <p>Nous ne partageons vos données personnelles avec aucun tiers, sauf :</p>
          <ul>
            <li>Si requis par la loi</li>
            <li>Pour les traitements de paiement sécurisés</li>
            <li>Pour les services d'hébergement et d'infrastructure technique</li>
          </ul>
        </section>

        <section>
          <h2>5. Sécurité</h2>
          <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.</p>
        </section>

        <section>
          <h2>6. Vos droits</h2>
          <p>Conformément à la loi marocaine 09-08 et au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li>Droit d'accès à vos données</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement</li>
            <li>Droit d'opposition au traitement</li>
            <li>Droit à la portabilité</li>
          </ul>
          <p>Pour exercer vos droits, contactez-nous à : contact@contact.occasionetgarantie.store</p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>Pour toute question relative à cette politique de confidentialité :</p>
          <p>Email : contact@contact.occasionetgarantie.store</p>
          <p>Téléphone : +212 669-017295</p>
          <p>Adresse : Casablanca, Maroc</p>
        </section>
      </div>
    </motion.div>
  );
}
