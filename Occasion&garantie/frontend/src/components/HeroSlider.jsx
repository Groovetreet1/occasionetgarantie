import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const slides = [
  {
    id: 1,
    title: "Des produits d'exception à prix réduits",
    subtitle: 'Chaque article est vérifié, testé et garanti. Profitez du meilleur de la technologie sans vous ruiner.',
    cta: 'Découvrir nos produits',
    link: '/products',
    orbColor: '#F59E0B',
  },
  {
    id: 2,
    title: 'Garantie incluse sur tous nos produits',
    subtitle: '15 jours de garantie minimum sur chaque achat. Votre satisfaction est notre priorité.',
    cta: 'Voir la garantie',
    link: '/products',
    orbColor: '#3B82F6',
  },
  {
    id: 3,
    title: 'Livraison rapide à Casablanca',
    subtitle: 'Livraison gratuite sous 24h sur tout Casablanca. Suivi de commande en temps réel.',
    cta: 'Nous contacter',
    link: 'https://wa.me/212669017295',
    external: true,
    orbColor: '#10B981',
  },
  {
    id: 4,
    title: 'Qualité testée et vérifiée',
    subtitle: 'Nos experts vérifient chaque article avant mise en vente. Qualité irréprochable.',
    cta: 'Créer un compte',
    link: '/signup',
    orbColor: '#F59E0B',
  },
];

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
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
    if (!paused) startTimer();
    return stopTimer;
  }, [paused, startTimer, stopTimer]);

  const goTo = (i) => { setCurrent(i); startTimer(); };
  const prev = () => { setCurrent((p) => (p - 1 + slides.length) % slides.length); startTimer(); };
  const next = () => { setCurrent((p) => (p + 1) % slides.length); startTimer(); };

  return (
    <section className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          className="hero-slide"
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <div className="hero-slide-bg" />
          <div className="hero-slide-overlay" />
          <div className="hero-slide-orb" />
          <div className="container">
            <div className="hero-slide-body">
              <motion.div
                className="hero-slide-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2>{slides[current].title}</h2>
                <p>{slides[current].subtitle}</p>
                {slides[current].external ? (
                  <a href={slides[current].link} target="_blank" rel="noopener noreferrer"
                    className="btn btn-primary">
                    {slides[current].cta} <FiArrowRight size={18} />
                  </a>
                ) : (
                  <Link to={slides[current].link} className="btn btn-primary">
                    {slides[current].cta} <FiArrowRight size={18} />
                  </Link>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="hero-arrow hero-arrow-prev" onClick={prev} aria-label="Précédent">
        <FiChevronLeft size={28} />
      </button>
      <button className="hero-arrow hero-arrow-next" onClick={next} aria-label="Suivant">
        <FiChevronRight size={28} />
      </button>
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </section>
  );
}
