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
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.38) 0%, rgba(15,23,42,0.12) 100%)',
  },
  {
    id: 2,
    titleKey: 'home.heroSlide2Title',
    subtitleKey: 'home.heroSlide2Subtitle',
    ctaKey: 'home.heroSlide2Cta',
    link: '/signup',
    image: '/slides/slide2.jpg',
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.42) 0%, rgba(15,23,42,0.15) 100%)',
  },
  {
    id: 3,
    titleKey: 'home.heroSlide3Title',
    subtitleKey: 'home.heroSlide3Subtitle',
    ctaKey: 'home.heroSlide3Cta',
    link: '/products',
    image: '/slides/slide3.jpg',
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.40) 0%, rgba(15,23,42,0.14) 100%)',
  },
  {
    id: 4,
    titleKey: 'home.heroSlide1Title',
    subtitleKey: 'home.heroSlide1Subtitle',
    ctaKey: 'home.heroSlide1Cta',
    link: '/support',
    image: '/slides/support.jpg',
    overlay: 'linear-gradient(135deg, rgba(15,23,42,0.36) 0%, rgba(15,23,42,0.10) 100%)',
  },
];

const slideVariants = {
  enter: { opacity: 0, scale: 1.05 },
  center: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

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
                <h2 style={{ color: '#fff', textShadow: '0 2px 16px rgba(0,0,0,0.45)', fontWeight: 800 }}>{t(slides[current].titleKey)}</h2>
                <p style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 1px 8px rgba(0,0,0,0.35)' }}>{t(slides[current].subtitleKey)}</p>
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
