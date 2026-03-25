import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

export interface FavoriteProduct {
  _id: string;
  name: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  designer: {
    _id: string;
    name: string;
    businessName?: string;
  };
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  featured?: boolean;
  addedAt: string;
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  addToFavorites: (product: any) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  toggleFavorite: (product: any) => Promise<void>;
  clearFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Load favorites from localStorage on mount
  useEffect(() => {
    if (user) {
      loadFavoritesFromStorage();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const getFavoritesStorageKey = () => `favorites_${user?._id || 'guest'}`;

  const loadFavoritesFromStorage = () => {
    try {
      const stored = localStorage.getItem(getFavoritesStorageKey());
      if (stored) {
        const parsedFavorites = JSON.parse(stored);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites from storage:', error);
    }
  };

  const saveFavoritesToStorage = (favoritesToSave: FavoriteProduct[]) => {
    try {
      localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(favoritesToSave));
    } catch (error) {
      console.error('Error saving favorites to storage:', error);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav._id === productId);
  };

  const addToFavorites = async (product: any): Promise<void> => {
    if (!user) {
      addToast('error', 'Please log in to add favorites');
      return;
    }

    if (isFavorite(product._id)) {
      return; // Already in favorites
    }

    const favoriteProduct: FavoriteProduct = {
      _id: product._id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      images: product.images || [],
      category: product.category,
      designer: {
        _id: product.designer?._id || product.designerId,
        name: product.designer?.name || product.designerName,
        businessName: product.designer?.businessName
      },
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.inStock !== false, // Default to true if not specified
      featured: product.featured,
      addedAt: new Date().toISOString()
    };

    const updatedFavorites = [...favorites, favoriteProduct];
    setFavorites(updatedFavorites);
    saveFavoritesToStorage(updatedFavorites);
    
    addToast('success', `${product.name} added to favorites!`);
  };

  const removeFromFavorites = async (productId: string): Promise<void> => {
    const productToRemove = favorites.find(fav => fav._id === productId);
    const updatedFavorites = favorites.filter(fav => fav._id !== productId);
    
    setFavorites(updatedFavorites);
    saveFavoritesToStorage(updatedFavorites);
    
    if (productToRemove) {
      addToast('success', `${productToRemove.name} removed from favorites`);
    }
  };

  const toggleFavorite = async (product: any): Promise<void> => {
    if (isFavorite(product._id)) {
      await removeFromFavorites(product._id);
    } else {
      await addToFavorites(product);
    }
  };

  const clearFavorites = async (): Promise<void> => {
    setFavorites([]);
    saveFavoritesToStorage([]);
    addToast('success', 'All favorites cleared');
  };

  const refreshFavorites = async (): Promise<void> => {
    // In a real app, this would fetch from the backend
    // For now, just reload from storage
    loadFavoritesFromStorage();
  };

  const value = {
    favorites,
    loading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    clearFavorites,
    refreshFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
