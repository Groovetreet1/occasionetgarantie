import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();
  useEffect(() => { document.title = t('about.privacyMetaTitle'); }, [t]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="container legal-page">
        <Link to="/" className="back-link"><FiArrowLeft size={14} /> {t('about.backHome')}</Link>
        <h1>{t('about.privacyTitle')}</h1>
        <p className="legal-date">{t('about.lastUpdate')}</p>

        <section>
          <h2>{t('about.privacy1')}</h2>
          <p>{t('about.privacy1Intro')}</p>
          <ul>
            <li>{t('about.privacy1Li1')}</li>
            <li>{t('about.privacy1Li2')}</li>
            <li>{t('about.privacy1Li3')}</li>
            <li>{t('about.privacy1Li4')}</li>
            <li>{t('about.privacy1Li5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('about.privacy2')}</h2>
          <p>{t('about.privacy2Intro')}</p>
          <ul>
            <li>{t('about.privacy2Li1')}</li>
            <li>{t('about.privacy2Li2')}</li>
            <li>{t('about.privacy2Li3')}</li>
            <li>{t('about.privacy2Li4')}</li>
            <li>{t('about.privacy2Li5')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('about.privacy3')}</h2>
          <p>{t('about.privacy3Intro')}</p>
          <ul>
            <li>{t('about.privacy3Li1')}</li>
            <li>{t('about.privacy3Li2')}</li>
            <li>{t('about.privacy3Li3')}</li>
          </ul>
          <p>{t('about.privacy3Consent')}</p>
        </section>

        <section>
          <h2>{t('about.privacy4')}</h2>
          <p>{t('about.privacy4Intro')}</p>
          <ul>
            <li>{t('about.privacy4Li1')}</li>
            <li>{t('about.privacy4Li2')}</li>
            <li>{t('about.privacy4Li3')}</li>
          </ul>
        </section>

        <section>
          <h2>{t('about.privacy5')}</h2>
          <p>{t('about.privacy5Body')}</p>
        </section>

        <section>
          <h2>{t('about.privacy6')}</h2>
          <p>{t('about.privacy6Intro')}</p>
          <ul>
            <li>{t('about.privacy6Li1')}</li>
            <li>{t('about.privacy6Li2')}</li>
            <li>{t('about.privacy6Li3')}</li>
            <li>{t('about.privacy6Li4')}</li>
            <li>{t('about.privacy6Li5')}</li>
          </ul>
          <p>{t('about.privacy6Rights')}</p>
        </section>

        <section>
          <h2>{t('about.privacy7')}</h2>
          <p>{t('about.privacy7Intro')}</p>
          <p>{t('about.contactEmail')} : contact@contact.occasionetgarantie.store</p>
          <p>{t('about.contactPhone')} : +212 669-017295</p>
          <p>{t('about.contactAddress')} : Casablanca, Maroc</p>
        </section>
      </div>
    </motion.div>
  );
}
