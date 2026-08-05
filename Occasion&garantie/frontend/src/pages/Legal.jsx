import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Legal() {
  const { t } = useLanguage();
  useEffect(() => { document.title = t('about.legalMetaTitle'); }, [t]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="container legal-page">
        <Link to="/" className="back-link"><FiArrowLeft size={14} /> {t('about.backHome')}</Link>
        <h1>{t('about.legalTitle')}</h1>
        <p className="legal-date">{t('about.lastUpdate')}</p>

        <section>
          <h2>{t('about.legal1')}</h2>
          <p><strong>{t('about.legalPlatform')}</strong> Occasion & Garantie</p>
          <p><strong>{t('about.legalWebsite')}</strong> www.occasionetgarantie.store</p>
          <p><strong>{t('about.legalContact')}</strong> contact@contact.occasionetgarantie.store</p>
          <p><strong>{t('about.legalPhone')}</strong> +212 669-017295</p>
          <p><strong>{t('about.legalAddress')}</strong> Casablanca, Maroc</p>
        </section>

        <section>
          <h2>{t('about.legal2')}</h2>
          <p>{t('about.legal2Body')}</p>
        </section>

        <section>
          <h2>{t('about.legal3')}</h2>
          <ul>
            <li>{t('about.legal3Li1')}</li>
            <li>{t('about.legal3Li2')}</li>
            <li>{t('about.legal3Li3')}</li>
            <li>{t('about.legal3Li4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('about.legal4')}</h2>
          <ul>
            <li>{t('about.legal4Li1')}</li>
            <li>{t('about.legal4Li2')}</li>
            <li>{t('about.legal4Li3')}</li>
            <li>{t('about.legal4Li4')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('about.legal5')}</h2>
          <p>{t('about.legal5Body')}</p>
        </section>

        <section>
          <h2>{t('about.legal6')}</h2>
          <p>{t('about.legal6Body')}</p>
        </section>

        <section>
          <h2>{t('about.legal7')}</h2>
          <p>{t('about.legal7Body')}</p>
        </section>

        <section>
          <h2>{t('about.legal8')}</h2>
          <p>{t('about.legal8Body')}</p>
        </section>
      </div>
    </motion.div>
  );
}
