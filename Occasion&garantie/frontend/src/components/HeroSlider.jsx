import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function HeroSlider() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const slides = [
    {
      id: 1,
      title: t("Des produits d'exception à prix réduits"),
      subtitle: t('Chaque article est vérifié, testé et garanti. Profitez du meilleur de la technologie sans vous ruiner.'),
      cta: t('Découvrir nos produits'),
      link: '/products',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1a1a3e 30%, #F59E0B 65%, #10B981 100%)',
      orbColor: '#F59E0B',
    },
    {
      id: 2,
      title: t('Garantie incluse sur tous nos produits'),
      subtitle: t('15 jours de garantie minimum sur chaque achat. Votre satisfaction est notre priorité.'),
      cta: t('Voir la garantie'),
      link: '/products',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1a1a3e 30%, #3B82F6 65%, #10B981 100%)',
      orbColor: '#3B82F6',
    },
    {
      id: 3,
      title: t('Livraison rapide à Casablanca'),
      subtitle: t('Livraison gratuite sous 24h sur tout Casablanca. Suivi de commande en temps réel.'),
      cta: t('Nous contacter'),
      link: 'https://wa.me/212669017295',
      external: true,
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1a1a3e 30%, #F59E0B 65%, #3B82F6 100%)',
      orbColor: '#10B981',
    },
    {
      id: 4,
      title: t('Qualité testée et vérifiée'),
      subtitle: t('Nos experts vérifient chaque article avant mise en vente. Qualité irréprochable.'),
      cta: t('Créer un compte'),
      link: '/signup',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #1a1a3e 20%, #F59E0B 50%, #3B82F6 75%, #10B981 100%)',
      orbColor: '#F59E0B',
    },
  ];

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, [slides.length]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!paused) startTimer();
    return stopTimer;
  }, [paused, startTimer, stopTimer]);

  const goTo = (i) => {
    setCurrent(i);
    startTimer();
  };

  const prev = () => {
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
    startTimer();
  };

  const next = () => {
    setCurrent((p) => (p + 1) % slides.length);
    startTimer();
  };

  return (
    <section
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`hero-slide ${i === current ? 'active' : ''}`}
        >
          <div className="hero-slide-bg" style={{ background: slide.gradient }} />
          <div className="hero-slide-overlay" />
          <div
            className="hero-slide-orb"
            style={{
              background: `radial-gradient(circle, ${slide.orbColor} 0%, transparent 70%)`,
            }}
          />
          <div className="container">
            <div className="hero-slide-body">
              <div className="hero-slide-card">
                <h2 className="hero-slide-title">{slide.title}</h2>
                <p className="hero-slide-subtitle">{slide.subtitle}</p>
                {slide.external ? (
                  <a
                    href={slide.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary hero-slide-cta"
                  >
                    {slide.cta} <FiArrowRight size={18} />
                  </a>
                ) : (
                  <Link
                    to={slide.link}
                    className="btn btn-primary hero-slide-cta"
                  >
                    {slide.cta} <FiArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        className="hero-arrow hero-arrow-prev"
        onClick={prev}
        aria-label={t('Précédent')}
      >
        <FiChevronLeft size={28} />
      </button>
      <button
        className="hero-arrow hero-arrow-next"
        onClick={next}
        aria-label={t('Suivant')}
      >
        <FiChevronRight size={28} />
      </button>

      <div className="hero-dots">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
