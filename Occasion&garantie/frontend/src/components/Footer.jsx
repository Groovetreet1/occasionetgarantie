import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { BsInstagram, BsTiktok, BsWhatsapp } from 'react-icons/bs';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative bg-zinc-950 text-white mt-16 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Occasion & Garantie" className="w-11 h-11 rounded-xl object-contain bg-white p-1.5" />
              <h3 className="text-xl font-extrabold">Occasion &amp; Garantie</h3>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-sm">{t('footer.tagline')}</p>
            <div className="flex gap-2.5 mt-5">
              {[
                { href: 'https://instagram.com', icon: BsInstagram, label: 'Instagram' },
                { href: 'https://tiktok.com', icon: BsTiktok, label: 'TikTok' },
                { href: 'https://wa.me/212669017295', icon: BsWhatsapp, label: 'WhatsApp' },
              ].map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" title={label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-amber-500 hover:border-amber-500 hover:text-zinc-950 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4 pb-2 border-b border-white/10">{t('footer.navigation')}</h4>
            <div className="flex flex-col gap-1">
              <Link to="/" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('nav.home')}</Link>
              <Link to="/products" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.allProducts')}</Link>
              <Link to="/boutique" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.officialStore')}</Link>
              <Link to="/about" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.about')}</Link>
              <Link to="/login" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.myAccount')}</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4 pb-2 border-b border-white/10">{t('footer.categories')}</h4>
            <div className="flex flex-col gap-1">
              <Link to="/products?category=Smartphones" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.smartphones')}</Link>
              <Link to="/products?category=Tablettes" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.tablets')}</Link>
              <Link to="/products?category=Ordinateurs" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.computers')}</Link>
              <Link to="/products?category=Accessoires" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.accessories')}</Link>
              <Link to="/products?category=Gaming" className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1">{t('footer.gaming')}</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4 pb-2 border-b border-white/10">{t('footer.cities')}</h4>
            <div className="flex flex-col gap-1">
              {['casablanca','rabat','marrakech','tanger','fes','agadir'].map((c) => (
                <Link key={c} to={`/ville/${c}`} className="text-sm text-white/65 hover:text-amber-400 transition-colors py-1 capitalize">{c}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/45">
          <p>&copy; {new Date().getFullYear()} Occasion &amp; Garantie. {t('footer.allRights')}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="hover:text-amber-400 transition-colors">{t('footer.privacy')}</Link>
            <Link to="/legal" className="hover:text-amber-400 transition-colors">{t('footer.legal')}</Link>
            <Link to="/about" className="hover:text-amber-400 transition-colors">{t('footer.about')}</Link>
            <span className="text-white/30">|</span>
            <a href="https://templatesjungle.com/" target="_blank" rel="noopener noreferrer" className="text-amber-400 font-semibold hover:underline">
              Template by TemplatesJungle
            </a>
          </div>
        </div>

        {/* Contact block */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm text-white/60">
          <a href="mailto:contact@contact.occasionetgarantie.store" className="flex items-center gap-2 hover:text-amber-400 transition-colors"><Mail className="w-4 h-4 text-amber-500" /> contact@contact.occasionetgarantie.store</a>
          <a href="tel:+212669017295" className="flex items-center gap-2 hover:text-amber-400 transition-colors"><Phone className="w-4 h-4 text-amber-500" /> +212 669-017295</a>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" /> {t('footer.casablanca')}</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> {t('footer.hours')}</span>
        </div>
      </div>
    </footer>
  );
}
