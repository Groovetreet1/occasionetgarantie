import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';

const testimonials = [
  { name: 'Karim B.', role: 'Achat iPhone 13', text: "Très satisfait de mon achat. Le téléphone était en parfait état, comme neuf. Livraison rapide à Casablanca. Je recommande vivement !", rating: 5 },
  { name: 'Sara M.', role: 'Achat MacBook Air', text: "Je cherchais un MacBook reconditionné de qualité. Produit conforme à la description, emballage soigné. Service client réactif sur WhatsApp.", rating: 5 },
  { name: 'Youssef H.', role: 'Achat Galaxy S24', text: "Première expérience avec ce site, et franchement satisfait. Le rapport qualité-prix est imbattable. Je reviendrai pour mes prochains achats.", rating: 5 },
  { name: 'Fatima Z.', role: 'Achat iPad 9', text: "Commande reçue en 24h. Produit impeccable avec garantie. Je recommande à tous ceux qui cherchent des produits reconditionnés de qualité.", rating: 4 },
  { name: 'Amine R.', role: 'Achat accessoires', text: "Coque et verre trempé de très bonne qualité. Prix raisonnables. Le site est bien fait et facile à naviguer. Merci à toute l'équipe.", rating: 5 },
  { name: 'Nadia L.', role: 'Achat iPhone 14 Pro', text: "Produit reçu plus tôt que prévu. L'iPhone est comme neuf, batterie à 100%. Service après-vente au top. 5 étoiles sans hésitation.", rating: 5 },
];

export default function TestimonialsSection() {
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
          <h2 className="section-title">Ce que disent nos clients</h2>
          <p className="section-subtitle">Des milliers de clients satisfaits nous font confiance.</p>
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
                <p className="testimonial-text">"{testimonials[current].text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{testimonials[current].name[0]}</div>
                  <div>
                    <strong>{testimonials[current].name}</strong>
                    <span>{testimonials[current].role}</span>
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
