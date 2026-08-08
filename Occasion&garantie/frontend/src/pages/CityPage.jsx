import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiMapPin, FiArrowRight, FiShield, FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import api from '../api/axios';
import HomeProductCard from '../components/HomeProductCard';
import usePageMeta from '../utils/usePageMeta';
import { useLanguage } from '../context/LanguageContext';

const CITIES = {
  casablanca: 'Casablanca',
  rabat: 'Rabat',
  marrakech: 'Marrakech',
  fes: 'Fes',
  tanger: 'Tanger',
  agadir: 'Agadir',
  meknes: 'Meknes',
  oujda: 'Oujda',
  kenitra: 'Kenitra',
  tetouan: 'Tetouan',
};

const CATEGORIES = ['Smartphones', 'Tablettes', 'Ordinateurs', 'Accessoires', 'Gaming'];

const cityFaq = (city) => [
  {
    q: `Où acheter un téléphone d'occasion à ${city} en toute sécurité ?`,
    a: `Chez Occasion & Garantie, chaque téléphone d'occasion à ${city} est vérifié, testé et garanti. Achetez en ligne avec livraison rapide et retour facile.`,
  },
  {
    q: `Quels produits électroniques d'occasion puis-je trouver à ${city} ?`,
    a: `Smartphones (iPhone, Samsung, Xiaomi...), tablettes, ordinateurs portables, accessoires et gaming d'occasion, tous testés avant d'être mis en vente à ${city}.`,
  },
  {
    q: `Comment vendre mon téléphone à ${city} ?`,
    a: `Publiez votre annonce gratuitement en quelques minutes sur Occasion & Garantie. Zéro commission, paiement sécurisé et visibilité auprès des acheteurs à ${city} et dans tout le Maroc.`,
  },
  {
    q: 'Y a-t-il une garantie sur les produits d\'occasion achetés chez Occasion & Garantie ?',
    a: 'Oui. La plupart des annonces incluent une garantie, et chaque produit de la Boutique Officielle est couvert. Satisfait ou remboursé.',
  },
];

function SkeletonGrid() {
  return (
    <div className="products-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-img" /><div className="skeleton-text" /><div className="skeleton-text-short" /><div className="skeleton-price" />
        </div>
      ))}
    </div>
  );
}

export default function CityPage() {
  const { slug } = useParams();
  const city = CITIES[(slug || '').toLowerCase()];
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!city) return;
    setLoading(true);
    api.get('/products', { params: { ville: city } })
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, city]);

  usePageMeta({
    title: city ? `Téléphones et électronique d'occasion à ${city} - Occasion & Garantie` : 'Occasion & Garantie',
    description: city
      ? `Achetez et vendez des téléphones et produits électroniques d'occasion à ${city} avec garantie. Smartphones iPhone, Samsung, Xiaomi, tablettes et PC au meilleur prix au Maroc.`
      : undefined,
    keywords: city ? `${city}, téléphone occasion, électronique, occasion, maroc, garantie, smartphone, iphone, samsung, xiaomi` : undefined,
    image: '/logo.png',
    canonical: city ? `https://www.occasionetgarantie.store/ville/${city.toLowerCase()}` : undefined,
    jsonLd: city ? [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.occasionetgarantie.store/' },
          { '@type': 'ListItem', position: 2, name: `Occasion à ${city}`, item: `https://www.occasionetgarantie.store/ville/${city.toLowerCase()}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: cityFaq(city).map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ] : undefined,
  });

  if (!city) {
    return (
      <section className="products-page">
        <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
          <div className="icon" style={{ marginBottom: 12 }}><FiShoppingBag size={48} /></div>
          <h2>Ville introuvable</h2>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>{t('products.backToProducts')}</Link>
        </div>
      </section>
    );
  }

  const faq = cityFaq(city);

  return (
    <section className="products-page">
      <div className="container" style={{ paddingTop: '120px', paddingBottom: '60px' }}>
        <nav className="breadcrumb" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
          <FiChevronRight size={13} />
          <span>{city}</span>
        </nav>

        <div style={{ maxWidth: 760, marginBottom: 28 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiMapPin style={{ color: '#d97706' }} /> Téléphones d'occasion à {city}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.7 }}>
            Achetez et vendez des smartphones, tablettes, PC et accessoires d'occasion à {city} avec garantie.
            Chaque annonce est vérifiée par Occasion & Garantie : paiement sécurisé, livraison rapide et retour facile.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {CATEGORIES.map((c) => (
            <Link key={c} to={`/products?category=${c}&ville=${encodeURIComponent(city)}`} className="btn btn-ghost" style={{ fontSize: 13 }}>
              {c} <FiArrowRight size={13} />
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Annonces à {city}</h2>
        {loading ? (
          <SkeletonGrid />
        ) : products.length > 0 ? (
          <div className="products-grid">
            {products.map((p, i) => <HomeProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon"><FiShoppingBag size={40} /></div>
            <h3>Aucune annonce à {city} pour le moment</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 14 }}>De nouvelles annonces arrivent chaque jour. Parcourez toutes les annonces du Maroc.</p>
            <Link to="/products" className="btn btn-primary"><FiArrowRight /> {t('products.backToProducts')}</Link>
          </div>
        )}

        <div className="trust-strip" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 28 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}><FiShield /> Garantie sur chaque achat</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}><FiMapPin /> Produits vérifiés</span>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Questions fréquentes à {city}</h2>
          {faq.map((f, i) => (
            <div key={i} style={{ border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 18px', marginBottom: 12, background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.q}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 36, textAlign: 'center', border: '1px solid var(--border-light)', borderRadius: 16, padding: 28, background: 'var(--bg-card)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Vous avez un téléphone à vendre à {city} ?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Publiez votre annonce gratuitement, zéro commission.</p>
          <Link to="/vendre" className="btn btn-primary"><FiArrowRight /> Vendre maintenant</Link>
        </div>
      </div>
    </section>
  );
}
