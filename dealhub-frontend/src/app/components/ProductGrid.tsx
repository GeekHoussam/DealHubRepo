import { ImageWithFallback } from './figma/ImageWithFallback';
import { Heart } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center text-gray-500">
          <p className="text-xl">No products found matching your search.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl mb-2">New Arrivals</h2>
        <p className="text-gray-600">Handpicked pieces from our latest collection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg mb-3 aspect-square bg-gray-100">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50">
                <Heart className="w-5 h-5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4">
                <button className="w-full bg-white text-gray-900 py-2 rounded-full hover:bg-gray-100 transition-colors">
                  Quick View
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">{product.category}</p>
              <h3 className="mb-1">{product.name}</h3>
              <p className="text-gray-900">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
