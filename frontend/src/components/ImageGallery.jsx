import { useEffect, useRef } from 'react';
import anime from 'animejs';

const ImageGallery = () => {
  const galleryRef = useRef([]);

  useEffect(() => {
    galleryRef.current.forEach((item, index) => {
      anime({
        targets: item,
        opacity: [0, 1],
        translateY: [30, 0],
        delay: index * 100,
        duration: 800,
        easing: 'easeOutExpo',
      });
    });
  }, []);

  const images = [
    {
      url: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop',
      label: 'Healthy Leaf',
      status: 'healthy'
    },
    {
      url: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop',
      label: 'Field Monitoring',
      status: 'monitoring'
    },
    {
      url: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop',
      label: 'Crop Analysis',
      status: 'analysis'
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <div
          key={index}
          ref={(el) => (galleryRef.current[index] = el)}
          className="glass glass-hover rounded-2xl overflow-hidden group opacity-0 card-shadow"
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={image.url}
              alt={image.label}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h4 className="font-semibold text-white">{image.label}</h4>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;
