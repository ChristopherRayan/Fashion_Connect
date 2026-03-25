import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FloatingButtonsContextType {
  isFloatingButtonsVisible: boolean;
  hideFloatingButtons: () => void;
  showFloatingButtons: () => void;
}

const FloatingButtonsContext = createContext<FloatingButtonsContextType | undefined>(undefined);

interface FloatingButtonsProviderProps {
  children: ReactNode;
}

export const FloatingButtonsProvider: React.FC<FloatingButtonsProviderProps> = ({ children }) => {
  const [showButtons, setShowButtons] = useState(true);

  const hideFloatingButtons = () => setShowButtons(false);
  const showFloatingButtons = () => setShowButtons(true);

  return (
    <FloatingButtonsContext.Provider
      value={{
        isFloatingButtonsVisible: showButtons,
        hideFloatingButtons,
        showFloatingButtons,
      }}
    >
      {children}
    </FloatingButtonsContext.Provider>
  );
};

export const useFloatingButtons = (): FloatingButtonsContextType => {
  const context = useContext(FloatingButtonsContext);
  if (context === undefined) {
    throw new Error('useFloatingButtons must be used within a FloatingButtonsProvider');
  }
  return context;
};
