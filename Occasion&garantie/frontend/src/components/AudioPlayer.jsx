import { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AudioPlayer({ src, duration, size = 'message' }) {
  const { t } = useLanguage();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [metaDuration, setMetaDuration] = useState(duration || 0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      setCurrent(a.currentTime || 0);
      if (a.duration && !isNaN(a.duration)) {
        setProgress((a.currentTime / a.duration) * 100);
        setMetaDuration(a.duration);
      }
    };
    const onEnded = () => { setPlaying(false); setCurrent(0); setProgress(0); };
    const onLoaded = () => {
      if (a.duration && !isNaN(a.duration)) setMetaDuration(a.duration);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    a.addEventListener('loadedmetadata', onLoaded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('loadedmetadata', onLoaded);
    };
  }, []);

  useEffect(() => () => {
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().catch(() => {});
      setPlaying(true);
    }
  };

  const seek = (e) => {
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (a.duration && !isNaN(a.duration)) {
      a.currentTime = ratio * a.duration;
      setProgress(ratio * 100);
    }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const total = Math.round(metaDuration || current + 1);

  return (
    <div className={`audio-player audio-player-${size}`}>
      <audio ref={audioRef} preload="metadata" src={src} />
      <button type="button" className="audio-play-btn" onClick={toggle} aria-label={playing ? t('messenger.pause') : t('messenger.play')}>
        {playing ? <FiPause size={16} /> : <FiPlay size={16} style={{ marginLeft: 2 }} />}
      </button>
      <div className="audio-track" onClick={seek}>
        <div className="audio-track-fill" style={{ width: `${progress}%` }} />
      </div>
      <button
        type="button"
        className="audio-speed-btn"
        onClick={() => setRate((r) => RATES[(RATES.indexOf(r) + 1) % RATES.length])}
        title={t('messenger.speed')}
      >
        {rate}x
      </button>
      <span className="audio-time">{fmt(current)}</span>
      <span className="audio-time audio-time-total">{fmt(total)}</span>
    </div>
  );
}
