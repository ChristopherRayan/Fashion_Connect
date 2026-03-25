import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  productCount: number;
  slug: string;
}

interface CategoryCardProps {
  category: Category;
  className?: string;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, className = '' }) => {
  return (
    <Link 
      to={`/client/browse?category=${category.slug}`}
      className={`group relative block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Category Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={category.image || '/api/placeholder/400/400'}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-400 transition-colors duration-200">
            {category.name}
          </h3>
          <p className="text-sm text-gray-200 mb-3 line-clamp-2">
            {category.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {category.productCount} products
            </span>
            <div className="flex items-center gap-1 text-yellow-400 group-hover:gap-2 transition-all duration-200">
              <span className="text-sm font-medium">Explore</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;
