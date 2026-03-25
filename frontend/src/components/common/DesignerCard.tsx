import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Eye } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

export interface Designer {
  _id: string;
  name: string;
  businessName?: string;
  specialty?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
}

interface DesignerCardProps {
  designer: Designer;
  className?: string;
}

const DesignerCard: React.FC<DesignerCardProps> = ({ designer, className = '' }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/api/placeholder/400/400';
  };

  return (
    <div className={`group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col ${className}`}>
      {/* Glowing effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute inset-0 ring-2 ring-yellow-400/0 group-hover:ring-yellow-400/50 rounded-lg transition-all duration-300 pointer-events-none" />
      
      {/* Designer Image - Square aspect ratio */}
      <div className="relative w-full aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
        <img
          src={designer.profileImage ? getImageUrl(designer.profileImage) : '/api/placeholder/400/400'}
          alt={designer.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating badge */}
        {designer.rating && (
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-white font-medium">
              {designer.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Designer Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Specialty */}
        {designer.specialty && (
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
            {designer.specialty}
          </p>
        )}

        {/* Designer Name */}
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight group-hover:text-yellow-600 transition-colors duration-200">
          {designer.name}
        </h3>

        {/* Business Name */}
        {designer.businessName && (
          <p className="text-xs text-gray-600 mb-2 font-medium">
            {designer.businessName}
          </p>
        )}

        {/* Location */}
        {designer.location && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{designer.location}</span>
          </div>
        )}

        {/* Bio */}
        {designer.bio && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 overflow-hidden flex-grow">
            {designer.bio}
          </p>
        )}

        {/* Rating and Reviews */}
        {designer.rating && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(designer.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              {designer.rating.toFixed(1)} ({designer.reviewCount || 0})
            </span>
          </div>
        )}

        {/* View Collection Button */}
        <Link
          to={`/client/designer/${designer._id}`}
          className="mt-auto w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-all duration-200 text-center text-sm flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-yellow-400/25"
        >
          <Eye className="h-4 w-4" />
          View Collection
        </Link>
      </div>
    </div>
  );
};

export default DesignerCard;
