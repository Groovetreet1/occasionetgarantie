import { useState, useEffect, useCallback, useRef } from 'react';
import { FiUsers, FiHeart, FiShield, FiStar, FiAward, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const slides = [
  {
    id: 1,
    icon: <FiHeart size={32} />,
    title: 'Notre Passion',
    subtitle:
      'Chez Occasion & Garantie, nous croyons que la technologie devrait être accessible à tous. Depuis notre création, nous sélectionnons avec soin chaque produit pour offrir le meilleur rapport qualité-prix.',
    gradient: 'linear-gradient(135deg, #F59E0B, #EC4899)',
  },
  {
    id: 2,
    icon: <FiUsers size={32} />,
    title: 'Qui Sommes-Nous ?',
    subtitle:
      'Une équipe de passionnés de technologie, experts en reconditionnement et test de produits. Notre mission : vous proposer des articles de qualité à prix réduits, avec une garantie et un service client irréprochable.',
    gradient: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
  },
  {
    id: 3,
    icon: <FiShield size={32} />,
    title: 'Notre Engagement',
    subtitle:
      'Chaque produit est rigoureusement testé par nos experts avant d\'être mis en vente. Nous offrons une garantie minimum de 15 jours sur tous nos articles pour votre tranquillité d\'esprit.',
    gradient: 'linear-gradient(135deg, #10B981, #06B6D4)',
  },
  {
    id: 4,
    icon: <FiAward size={32} />,
    title: 'Pourquoi Nous Faire Confiance ?',
    subtitle:
      'Des centaines de clients satisfaits, des produits vérifiés, une livraison rapide et un support client disponible 7j/7. Votre satisfaction est notre priorité absolue.',
    gradient: 'linear-gradient(135deg, #F59E0B, #10B981)',
  },
  {
    id: 5,
    icon: <FiStar size={32} />,
    title: 'Notre Vision',
    subtitle:
      'Devenir la référence marocaine de l\'électronique reconditionnée de confiance. Nous travaillons chaque jour pour rendre la technologie premium accessible à tous, avec transparence et bienveillance.',
    gradient: 'linear-gradient(135deg, #EC4899, #8B5CF6)',
  },
];

export default function AboutSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startTimer();
    return stopTimer;
  }, [startTimer, stopTimer]);

  const goTo = (i) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
    startTimer();
  };

  const prev = () => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
    startTimer();
  };

  const next = () => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
    startTimer();
  };

  return (
    <section className="about-slider-section">
      <div className="container">
        <div className="about-slider-header">
          <h2 className="section-title">Qui sommes-nous ?</h2>
          <p className="section-subtitle">
            Découvrez l&rsquo;histoire et les valeurs qui font d&rsquo;Occasion &amp; Garantie
            votre partenaire de confiance.
          </p>
        </div>

        <div className="about-slider-wrapper">
          <button
            className="about-arrow about-arrow-prev"
            onClick={prev}
            aria-label="Précédent"
          >
            <FiChevronLeft size={24} />
          </button>

          <div className="about-slider-track">
            {slides.map((slide, i) => {
              const isActive = i === current;
              const isPrev =
                i === (current - 1 + slides.length) % slides.length;
              const isNext = i === (current + 1) % slides.length;

              return (
                <div
                  key={slide.id}
                  className={`about-slide ${isActive ? 'active' : ''} ${isPrev ? 'prev' : ''} ${isNext ? 'next' : ''}`}
                  style={{ '--slide-gradient': slide.gradient }}
                >
                  <div className="about-slide-glow" />
                  <div className="about-slide-icon">{slide.icon}</div>
                  <h3 className="about-slide-title">{slide.title}</h3>
                  <p className="about-slide-text">{slide.subtitle}</p>
                </div>
              );
            })}
          </div>

          <button
            className="about-arrow about-arrow-next"
            onClick={next}
            aria-label="Suivant"
          >
            <FiChevronRight size={24} />
          </button>
        </div>

        <div className="about-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`about-dot ${i === current ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
