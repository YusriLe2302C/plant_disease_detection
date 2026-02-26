import { useEffect, useRef } from 'react';
import anime from 'animejs';

const AnimatedBackground = () => {
  const blobsRef = useRef([]);

  useEffect(() => {
    blobsRef.current.forEach((blob, index) => {
      anime({
        targets: blob,
        translateX: () => anime.random(-100, 100),
        translateY: () => anime.random(-100, 100),
        scale: () => anime.random(0.8, 1.2),
        duration: () => anime.random(3000, 5000),
        easing: 'easeInOutQuad',
        loop: true,
        direction: 'alternate',
        delay: index * 500,
      });
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1920&h=1080&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Animated Gradient Blobs */}
      <div
        ref={(el) => (blobsRef.current[0] = el)}
        className="absolute top-20 left-10 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
      />
      <div
        ref={(el) => (blobsRef.current[1] = el)}
        className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl"
      />
      <div
        ref={(el) => (blobsRef.current[2] = el)}
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl"
      />
    </div>
  );
};

export default AnimatedBackground;
