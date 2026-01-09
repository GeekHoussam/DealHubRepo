import { ImageWithFallback } from './figma/ImageWithFallback';
import { ArrowRight } from 'lucide-react';

interface Collection {
  id: number;
  name: string;
  description: string;
  image: string;
  itemCount: number;
}

interface FeaturedCollectionsProps {
  collections: Collection[];
}

export function FeaturedCollections({ collections }: FeaturedCollectionsProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl mb-4">Featured Collections</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore our curated selection of handcrafted jewelry, each piece uniquely designed by skilled artisans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg mb-4 aspect-[3/4]">
              <ImageWithFallback
                src={collection.image}
                alt={collection.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{collection.itemCount} items</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl mb-2">{collection.name}</h3>
            <p className="text-gray-600">{collection.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
