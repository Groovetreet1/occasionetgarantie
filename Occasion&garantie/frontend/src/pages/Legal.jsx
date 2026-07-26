import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Legal() {
  useEffect(() => { document.title = 'Mentions légales & CGV - Occasion & Garantie'; }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="container legal-page">
        <Link to="/" className="back-link"><FiArrowLeft size={14} /> Retour à l'accueil</Link>
        <h1>Mentions légales & Conditions générales</h1>
        <p className="legal-date">Dernière mise à jour : juillet 2026</p>

        <section>
          <h2>1. Informations légales</h2>
          <p><strong>Plateforme :</strong> Occasion & Garantie</p>
          <p><strong>Site web :</strong> www.occasionetgarantie.store</p>
          <p><strong>Contact :</strong> contact@contact.occasionetgarantie.store</p>
          <p><strong>Téléphone :</strong> +212 669-017295</p>
          <p><strong>Adresse :</strong> Casablanca, Maroc</p>
        </section>

        <section>
          <h2>2. Objet</h2>
          <p>Les présentes conditions générales régissent l'utilisation de la plateforme Occasion & Garantie, marketplace de vente de produits électroniques d'occasion.</p>
        </section>

        <section>
          <h2>3. Inscription et compte</h2>
          <ul>
            <li>L'inscription est gratuite et ouverte à toute personne physique majeure</li>
            <li>L'utilisateur s'engage à fournir des informations exactes</li>
            <li>Chaque compte est personnel et non transférable</li>
            <li>L'utilisateur est responsable de la confidentialité de ses identifiants</li>
          </ul>
        </section>

        <section>
          <h2>4. Produits et annonces</h2>
          <ul>
            <li>Seuls les produits électroniques et tech sont autorisés</li>
            <li>Le vendeur est seul responsable du contenu et de la conformité de ses annonces</li>
            <li>Les produits doivent être décrits de manière précise et honnête</li>
            <li>La plateforme se réserve le droit de refuser ou supprimer toute annonce non conforme</li>
          </ul>
        </section>

        <section>
          <h2>5. Transactions</h2>
          <p>Occasion & Garantie met en relation acheteurs et vendeurs mais n'est pas partie aux transactions. Les modalités de paiement et de livraison sont convenues directement entre les parties.</p>
        </section>

        <section>
          <h2>6. Responsabilité</h2>
          <p>La plateforme ne peut être tenue responsable des litiges entre acheteurs et vendeurs. Nous nous engageons à mettre en œuvre tous les moyens pour assurer le bon fonctionnement de la plateforme.</p>
        </section>

        <section>
          <h2>7. Propriété intellectuelle</h2>
          <p>Tous les contenus présents sur la plateforme (logos, textes, images) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite.</p>
        </section>

        <section>
          <h2>8. Modification des CGV</h2>
          <p>Nous nous réservons le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés de toute modification significative.</p>
        </section>
      </div>
    </motion.div>
  );
}
