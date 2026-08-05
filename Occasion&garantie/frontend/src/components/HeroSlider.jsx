import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const slides = [
  {
    id: 1,
    titleKey: 'home.heroSlide1Title',
    subtitleKey: 'home.heroSlide1Subtitle',
    ctaKey: 'home.heroSlide1Cta',
    link: '/products',
    orbColor: '#F59E0B',
  },
  {
    id: 2,
    titleKey: 'home.heroSlide2Title',
    subtitleKey: 'home.heroSlide2Subtitle',
    ctaKey: 'home.heroSlide2Cta',
    link: '/signup',
    orbColor: '#F59E0B',
  },
  {
    id: 3,
    titleKey: 'home.heroSlide3Title',
    subtitleKey: 'home.heroSlide3Subtitle',
    ctaKey: 'home.heroSlide3Cta',
    link: '/products',
    orbColor: '#3B82F6',
  },
];

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export default function HeroSlider() {
  const { t } = useLanguage();
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
                <h2>{t(slides[current].titleKey)}</h2>
                <p>{t(slides[current].subtitleKey)}</p>
                <Link to={slides[current].link} className="btn btn-primary">
                  {t(slides[current].ctaKey)} <FiArrowRight size={18} />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button className="hero-arrow hero-arrow-prev" onClick={prev} aria-label={t('home.heroPrev')}>
        <FiChevronLeft size={28} />
      </button>
      <button className="hero-arrow hero-arrow-next" onClick={next} aria-label={t('home.heroNext')}>
        <FiChevronRight size={28} />
      </button>
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)} aria-label={t('home.heroSlideLabel', { number: i + 1 })} />
        ))}
      </div>
    </section>
  );
}
