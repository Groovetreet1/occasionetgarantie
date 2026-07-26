import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const AD_CLIENT = 'ca-pub-3266333749754332';

export default function AdBanner({ slot, format = 'auto', className = '', style = {} }) {
  const { user } = useAuth();
  const adRef = useRef(null);
  const loaded = useRef(false);

  const isPremium = user?.premium === 1 || user?.premium === true;

  useEffect(() => {
    if (isPremium || loaded.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      loaded.current = true;
    } catch {}
  }, [isPremium]);

  if (isPremium) return null;

  const isAutoRelaxed = format === 'autorelaxed';

  return (
    <div className={`ad-banner ${className}`} style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(isAutoRelaxed ? {} : { 'data-full-width-responsive': 'true' })}
      />
    </div>
  );
}
