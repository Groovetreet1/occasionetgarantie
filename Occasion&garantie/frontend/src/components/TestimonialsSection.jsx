import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const testimonials = [
  { name: 'Karim B.', roleKey: 'home.t1Role', textKey: 'home.t1Text', rating: 5 },
  { name: 'Sara M.', roleKey: 'home.t2Role', textKey: 'home.t2Text', rating: 5 },
  { name: 'Youssef H.', roleKey: 'home.t3Role', textKey: 'home.t3Text', rating: 5 },
  { name: 'Fatima Z.', roleKey: 'home.t4Role', textKey: 'home.t4Text', rating: 4 },
  { name: 'Amine R.', roleKey: 'home.t5Role', textKey: 'home.t5Text', rating: 5 },
  { name: 'Nadia L.', roleKey: 'home.t6Role', textKey: 'home.t6Text', rating: 5 },
];

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = () => { setDirection(1); setCurrent((p) => (p + 1) % testimonials.length); };
  const prev = () => { setDirection(-1); setCurrent((p) => (p - 1 + testimonials.length) % testimonials.length); };

  const variants = {
    enter: (d) => ({ x: d > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <section className="testimonials-section">
      <div className="container">
        <motion.div style={{ textAlign: 'center', marginBottom: '48px' }}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <h2 className="section-title">{t('home.testimonialsTitle')}</h2>
          <p className="section-subtitle">{t('home.testimonialsSubtitle')}</p>
        </motion.div>

        <div className="testimonials-carousel">
          <button className="testimonial-arrow testimonial-arrow-prev" onClick={prev}><FiChevronLeft size={24} /></button>
          <div className="testimonial-track">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                className="testimonial-card"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar key={i} size={18} fill={i < testimonials[current].rating ? 'var(--primary)' : 'none'} color="var(--primary)" />
                  ))}
                </div>
                <p className="testimonial-text">"{t(testimonials[current].textKey)}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonials[current].name[0]}</div>
                  <div>
                    <strong>{testimonials[current].name}</strong>
                    <span>{t(testimonials[current].roleKey)}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <button className="testimonial-arrow testimonial-arrow-next" onClick={next}><FiChevronRight size={24} /></button>
        </div>

        <div className="testimonial-dots">
          {testimonials.map((_, i) => (
            <button key={i} className={`testimonial-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
