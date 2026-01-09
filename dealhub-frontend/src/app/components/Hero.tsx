import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[500px] bg-gray-900 overflow-hidden">
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1758995115475-7b7d6eb060ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXdlbHJ5JTIwZ29sZHxlbnwxfHx8fDE3NjYwNTY4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Luxury artisan jewelry"
          className="w-full h-full object-cover opacity-60"
        />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl text-white mb-6">
            Handcrafted Elegance
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Discover unique, artisan-made jewelry pieces that tell your story
          </p>
          <button className="bg-white text-gray-900 px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
            Shop Collection
          </button>
        </div>
      </div>
    </section>
  );
}
