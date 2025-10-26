import React, { useEffect, useState, useRef } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaExpand, FaCompress } from 'react-icons/fa';

export default function ImagePreview({ images = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex || 0);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const touchStartX = useRef(null);

  useEffect(() => setIndex(startIndex || 0), [startIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, images]);

  const prev = () => setIndex(i => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setIndex(i => (i < images.length - 1 ? i + 1 : 0));

  const onTouchStart = (e) => (touchStartX.current = e.touches?.[0]?.clientX ?? null);
  const onTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    const threshold = 40;
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    touchStartX.current = null;
  };

  const toggleZoom = () => setZoom(z => (z === 1 ? 2 : 1));

  const img = images[index];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/40 text-white z-50"><FaTimes /></button>
      <button onClick={prev} className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white z-50"><FaChevronLeft /></button>
      <button onClick={next} className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white z-50"><FaChevronRight /></button>

      <div ref={containerRef} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="max-w-[95vw] max-h-[90vh] flex flex-col gap-3 items-center">
        <div className="w-full flex-1 flex items-center justify-center" onDoubleClick={toggleZoom}>
          {img.resource_type?.startsWith('video') ? (
            <video controls src={img.url} className="max-w-[95vw] max-h-[80vh] object-contain" />
          ) : (
            <img src={img.url} alt={`preview-${index}`} style={{ transform: `scale(${zoom})` }} className="max-w-[95vw] max-h-[80vh] object-contain" />
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-1 px-2 w-full justify-center">
            {images.map((it, i) => (
              <button key={it.public_id || it.url || i} onClick={() => setIndex(i)} className={`w-16 h-10 rounded-md overflow-hidden border-2 ${i === index ? 'border-white' : 'border-transparent'}`}>
                {it.resource_type?.startsWith('video') ? <video src={it.url} className="w-full h-full object-cover" muted /> : <img src={it.url} className="w-full h-full object-cover" alt={`thumb-${i}`} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}