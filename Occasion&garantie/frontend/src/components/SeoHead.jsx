import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://occasion-garantie.onrender.com';
const DEFAULT_IMG = 'https://occasion-garantie.onrender.com/uploads/og-image.jpg';

export default function SeoHead({
  title,
  description,
  image,
  url,
  type = 'website',
  locale = 'fr_FR',
  noIndex = false,
}) {
  const siteName = 'Occasion & Garantie';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} – Produits tech reconditionnés au Maroc`;
  const fullDesc = description || 'Achetez des smartphones, tablettes, ordinateurs et accessoires reconditionnés avec garantie. Livraison rapide à Casablanca, Bouskoura et Berrechid.';
  const fullImg = image || DEFAULT_IMG;
  const fullUrl = url || SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <meta name="keywords" content="occasion, garantie, reconditionné, Casablanca, Bouskoura, Berrechid, smartphone, tablette, ordinateur, Maroc, téléphone pas cher" />
      <meta name="geo.region" content="MA-06" />
      <meta name="geo.placename" content="Casablanca" />
      <meta name="geo.position" content="33.5731;-7.5898" />
      <meta name="ICBM" content="33.5731, -7.5898" />
      <meta name="audience" content="all" />
      <meta name="language" content="French" />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
      <meta property="og:image" content={fullImg} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={siteName} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDesc} />
      <meta name="twitter:image" content={fullImg} />

      <link rel="canonical" href={fullUrl} />
      {noIndex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
}
