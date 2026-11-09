import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowUpRight, MapPin, Shield, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Badge } from './ui/badge';

const API_BASE = import.meta.env.VITE_API_URL || '';

const toUrl = (img) => (img ? (img.startsWith('http') ? img : `${API_BASE}/uploads/${img}`) : null);

export default function HomeProductCard({ product, index = 0, view = 'grid' }) {
  const { t } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);

  const formatPrice = (p) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' })
      .format(p).replace('MAD', '').trim() + ' DH';

  let gallery = [];
  if (product.gallery) {
    try { gallery = typeof product.gallery === 'string' ? JSON.parse(product.gallery) : product.gallery; }
    catch (e) { gallery = []; }
  }
  if (!Array.isArray(gallery)) gallery = [];

  const photos = [];
  if (product.image) photos.push(product.image);
  gallery.forEach((img) => { if (img !== product.image && !photos.includes(img)) photos.push(img); });

  const isSold = product.status === 'vendu';
  const isPending = product.status === 'en_attente';
  const isStore = product.product_type === 'store';
  const discount = product.old_price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const detailLink = isStore ? `/boutique/${product.slug}` : `/products/${product.slug}`;
  const currentImg = toUrl(photos[photoIndex] || null);
  const ville = product.ville || product.city || 'Casablanca';
  const warranty = product.warranty || '12 mois';

  const goPrev = (e) => { e.preventDefault(); e.stopPropagation(); setPhotoIndex((i) => (i - 1 + photos.length) % photos.length); };
  const goNext = (e) => { e.preventDefault(); e.stopPropagation(); setPhotoIndex((i) => (i + 1) % photos.length); };

  const isList = view === 'list';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.38, delay: index * 0.045, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={detailLink}
        className={`group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all ${isSold ? 'opacity-75' : ''} ${isList ? 'flex' : ''}`}
      >
        <div className={`relative bg-muted overflow-hidden ${isList ? 'w-36 shrink-0 aspect-square' : 'aspect-square'}`}>
          {discount > 0 && (
            <Badge className="absolute top-2.5 right-2.5 z-10 bg-red-500 text-white border-0">-{discount}%</Badge>
          )}
          {isSold && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/55 backdrop-blur-sm text-white text-sm font-bold uppercase tracking-widest">
              {t('home.sold')}
            </div>
          )}
          {isPending && (
            <Badge className="absolute top-2.5 left-2.5 z-10 bg-amber-500 text-white border-0">{t('home.reserved')}</Badge>
          )}
          {isStore && (
            <Badge className="absolute top-2.5 left-2.5 z-10 bg-amber-500 text-zinc-950 border-0">
              <Star className="w-3 h-3 mr-1" /> Officiel
            </Badge>
          )}
          <span className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-card border border-border shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4" />
          </span>
          <div className={`w-full h-full flex items-center justify-center ${isList ? 'p-2.5' : 'p-5'}`}>
            {currentImg ? (
              <img src={currentImg} alt={product.name} loading="lazy" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <ShoppingBag className="w-10 h-10 opacity-20" />
            )}
          </div>
          {photos.length > 1 && (
            <>
              <button onClick={goPrev} aria-label={t('home.photoPrev')} className="absolute top-1/2 left-2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 text-zinc-900 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={goNext} aria-label={t('home.photoNext')} className="absolute top-1/2 right-2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 text-zinc-900 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-full bg-zinc-900/70 backdrop-blur text-white text-[10px] font-semibold">
                {photoIndex + 1}/{photos.length}
              </span>
            </>
          )}
        </div>

        <div className={`p-3.5 ${isList ? 'flex-1 min-w-0 flex flex-col justify-center' : ''}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{product.category || product.category_name || 'Smartphone'}</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" /> 4.8
            </span>
          </div>
          <h3 className="text-sm font-bold leading-snug line-clamp-2 min-h-[2.4rem]">{product.name}</h3>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-lg font-extrabold tracking-tight text-amber-500">{formatPrice(product.price)}</span>
            {product.old_price > product.price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.old_price)}</span>
            )}
          </div>
          {!isList && (
            <span className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-foreground/80 text-foreground text-[11px] font-bold uppercase tracking-wider group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-zinc-950 transition-colors mb-2.5">
              {t('home.viewProduct')} <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          )}
          <div className="flex items-center gap-2 flex-wrap border-t border-border pt-2.5 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
              <MapPin className="w-3 h-3" /> {ville}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Shield className="w-3 h-3" /> {warranty}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
