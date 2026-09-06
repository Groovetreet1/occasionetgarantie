import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiSearch, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const slides = [
  {
    id: 1,
    titleKey: 'home.heroSlide1Title',
    subtitleKey: 'home.heroSlide1Subtitle',
    ctaKey: 'home.heroSlide1Cta',
    link: '/products',
    image: '/slides/slide1.jpg',
    overlay: 'linear-gradient(135deg, rgba(245,158,11,0.52) 0%, rgba(217,119,6,0.22) 100%)',
  },
  {
    id: 2,
    titleKey: 'home.heroSlide2Title',
    subtitleKey: 'home.heroSlide2Subtitle',
    ctaKey: 'home.heroSlide2Cta',
    link: '/signup',
    image: '/slides/slide2.jpg',
    overlay: 'linear-gradient(135deg, rgba(59,130,246,0.48) 0%, rgba(37,99,235,0.18) 100%)',
  },
  {
    id: 3,
    titleKey: 'home.heroSlide3Title',
    subtitleKey: 'home.heroSlide3Subtitle',
    ctaKey: 'home.heroSlide3Cta',
    link: '/products',
    image: '/slides/slide3.jpg',
    overlay: 'linear-gradient(135deg, rgba(16,185,129,0.50) 0%, rgba(5,150,105,0.20) 100%)',
  },
  {
    id: 4,
    titleKey: 'home.heroSlide1Title',
    subtitleKey: 'home.heroSlide1Subtitle',
    ctaKey: 'home.heroSlide1Cta',
    link: '/support',
    image: '/slides/support.jpg',
    overlay: 'linear-gradient(135deg, rgba(139,92,246,0.46) 0%, rgba(124,58,237,0.18) 100%)',
  },
];

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

function Typewriter({ text, speed = 32, delay = 0, className, style }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let timer;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(timer); setDone(true); }
      }, speed);
    }, delay);
    return () => { clearTimeout(start); clearInterval(timer); };
  }, [text, speed, delay]);
  return (
    <span className={className} style={style}>
      {displayed}
      {!done && <span style={{ borderLeft: '2px solid currentColor', marginLeft: 2, animation: 'blink 0.9s step-end infinite' }}>&nbsp;</span>}
      <style>{`@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}`}</style>
    </span>
  );
}

export default function HeroSlider() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [cities, setCities] = useState([]);
  const [hasTyped, setHasTyped] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/products/cities').then(res => {
      if (res.data && res.data.length) setCities(res.data);
      else setCities(['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir']);
    }).catch(() => setCities(['Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir']));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/products?';
    if (searchTerm.trim()) url += `search=${encodeURIComponent(searchTerm.trim())}&`;
    if (selectedCategory) url += `category=${selectedCategory}&`;
    if (selectedCity) url += `ville=${encodeURIComponent(selectedCity)}&`;
    navigate(url);
  };

  useEffect(() => {
    const onDown = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

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

  useEffect(() => {
    if (current === 0 && !hasTyped) {
      const total = (t(slides[0].titleKey).length + t(slides[0].subtitleKey).length) * 32 + 800;
      const timer = setTimeout(() => setHasTyped(true), total);
      return () => clearTimeout(timer);
    }
  }, [current, hasTyped, t]);

  const goTo = (i) => { setCurrent(i); startTimer(); };
  const prev = () => { setCurrent((p) => (p - 1 + slides.length) % slides.length); startTimer(); };
  const next = () => { setCurrent((p) => (p + 1) % slides.length); startTimer(); };

  return (
    <section className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <form ref={searchRef} onSubmit={handleSearch} className={`hero-slider-search ${searchOpen ? '' : 'collapsed'}`} aria-label="Search" onClick={() => !searchOpen && setSearchOpen(true)}>
        {searchOpen ? (
          <>
            <FiSearch size={16} style={{ color: '#64748b', flexShrink: 0 }} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('home.searchPlaceholder')} aria-label={t('home.searchPlaceholder')} autoFocus />
            <div style={{ width: 1, height: 24, background: '#e2e8f0', flexShrink: 0 }} />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', background: 'transparent', cursor: 'pointer', flexShrink: 0 }}>
              <option value="">{t('home.allCategories')}</option>
              <option value="Smartphones">Smartphones</option>
              <option value="Tablettes">Tablettes</option>
              <option value="Ordinateurs">Ordinateurs</option>
              <option value="Accessoires">Accessoires</option>
            </select>
            <div style={{ width: 1, height: 24, background: '#e2e8f0', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <FiMapPin size={14} style={{ color: '#64748b' }} />
              <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, color: '#334155', background: 'transparent', cursor: 'pointer' }}>
                <option value="">{t('home.allCities')}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit">{t('common.search')}</button>
          </>
        ) : (
          <FiSearch size={18} style={{ color: '#1e293b' }} />
        )}
      </form>
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
          <div className="hero-slide-bg" style={{
            backgroundImage: `url(${slides[current].image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} />
          <div className="hero-slide-overlay" style={{ background: slides[current].overlay || 'var(--hero-overlay)' }} />
          <div className="container">
            <div className="hero-slide-body">
              <motion.div
                className="hero-slide-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
              >
                <h2 style={{ color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.45)', fontWeight: 800, minHeight: '1.2em' }}>
                  {!hasTyped && current === 0 ? <Typewriter text={t(slides[current].titleKey)} speed={32} /> : t(slides[current].titleKey)}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.35)', minHeight: '1.4em' }}>
                  {!hasTyped && current === 0 ? <Typewriter text={t(slides[current].subtitleKey)} speed={18} delay={t(slides[current].titleKey).length * 32 + 300} /> : t(slides[current].subtitleKey)}
                </p>
                <Link to={slides[current].link} className="btn btn-primary" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
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
