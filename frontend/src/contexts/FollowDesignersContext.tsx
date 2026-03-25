import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface FollowedDesigner {
  _id: string;
  name: string;
  businessName?: string;
  profileImage?: string;
  specialty?: string;
  location?: string;
  rating?: number;
  followedAt: string;
}

interface FollowDesignersContextType {
  followedDesigners: FollowedDesigner[];
  loading: boolean;
  isFollowing: (designerId: string) => boolean;
  followDesigner: (designer: any) => Promise<void>;
  unfollowDesigner: (designerId: string) => Promise<void>;
  toggleFollow: (designer: any) => Promise<void>;
  clearFollowedDesigners: () => Promise<void>;
  refreshFollowedDesigners: () => Promise<void>;
}

const FollowDesignersContext = createContext<FollowDesignersContextType | undefined>(undefined);

export function FollowDesignersProvider({ children }: { children: ReactNode }) {
  const [followedDesigners, setFollowedDesigners] = useState<FollowedDesigner[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { addToast } = useNotification();

  // Load followed designers from localStorage on mount
  useEffect(() => {
    if (user) {
      loadFollowedDesignersFromStorage();
    } else {
      setFollowedDesigners([]);
    }
  }, [user]);

  const getFollowedDesignersStorageKey = () => `followed_designers_${user?._id || 'guest'}`;

  const loadFollowedDesignersFromStorage = () => {
    try {
      const stored = localStorage.getItem(getFollowedDesignersStorageKey());
      if (stored) {
        const parsedFollowedDesigners = JSON.parse(stored);
        setFollowedDesigners(parsedFollowedDesigners);
      }
    } catch (error) {
      console.error('Error loading followed designers from storage:', error);
    }
  };

  const saveFollowedDesignersToStorage = (designers: FollowedDesigner[]) => {
    try {
      localStorage.setItem(getFollowedDesignersStorageKey(), JSON.stringify(designers));
    } catch (error) {
      console.error('Error saving followed designers to storage:', error);
    }
  };

  const isFollowing = (designerId: string): boolean => {
    return followedDesigners.some(designer => designer._id === designerId);
  };

  const followDesigner = async (designer: any): Promise<void> => {
    if (!user) {
      addToast('error', 'Please log in to follow designers');
      return;
    }

    if (isFollowing(designer._id)) {
      return; // Already following
    }

    const followedDesigner: FollowedDesigner = {
      _id: designer._id,
      name: designer.name,
      businessName: designer.businessName,
      profileImage: designer.profileImage,
      specialty: designer.specialty,
      location: designer.location,
      rating: designer.rating,
      followedAt: new Date().toISOString()
    };

    const updatedFollowedDesigners = [...followedDesigners, followedDesigner];
    setFollowedDesigners(updatedFollowedDesigners);
    saveFollowedDesignersToStorage(updatedFollowedDesigners);
    addToast('success', `Now following ${designer.name}`);
  };

  const unfollowDesigner = async (designerId: string): Promise<void> => {
    const designerToUnfollow = followedDesigners.find(d => d._id === designerId);
    const updatedFollowedDesigners = followedDesigners.filter(designer => designer._id !== designerId);
    setFollowedDesigners(updatedFollowedDesigners);
    saveFollowedDesignersToStorage(updatedFollowedDesigners);
    
    if (designerToUnfollow) {
      addToast('success', `Unfollowed ${designerToUnfollow.name}`);
    }
  };

  const toggleFollow = async (designer: any): Promise<void> => {
    if (isFollowing(designer._id)) {
      await unfollowDesigner(designer._id);
    } else {
      await followDesigner(designer);
    }
  };

  const clearFollowedDesigners = async (): Promise<void> => {
    setFollowedDesigners([]);
    saveFollowedDesignersToStorage([]);
    addToast('success', 'All followed designers cleared');
  };

  const refreshFollowedDesigners = async (): Promise<void> => {
    // In a real app, this would fetch from the backend
    // For now, just reload from storage
    loadFollowedDesignersFromStorage();
  };

  const value = {
    followedDesigners,
    loading,
    isFollowing,
    followDesigner,
    unfollowDesigner,
    toggleFollow,
    clearFollowedDesigners,
    refreshFollowedDesigners
  };

  return (
    <FollowDesignersContext.Provider value={value}>
      {children}
    </FollowDesignersContext.Provider>
  );
}

export function useFollowDesigners() {
  const context = useContext(FollowDesignersContext);
  if (context === undefined) {
    throw new Error('useFollowDesigners must be used within a FollowDesignersProvider');
  }
  return context;
}
