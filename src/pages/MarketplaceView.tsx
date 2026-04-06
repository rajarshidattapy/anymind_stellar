import React, { useEffect, useRef } from 'react';
import Marketplace from './Marketplace';
import Staking from './Staking';

interface MarketplaceViewProps {
  activeSubTab: string;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ activeSubTab }) => {
  const prevSubTabRef = useRef<string>('');
  
  useEffect(() => {
    // If switching from staking to browse, the Marketplace component will refresh on mount
    prevSubTabRef.current = activeSubTab;
  }, [activeSubTab]);

  // Default to 'browse' if activeSubTab is empty or undefined
  const currentSubTab = activeSubTab || 'browse';

  if (currentSubTab === 'staking') {
    return <Staking />;
  }
  
  // Use key prop to force remount when switching tabs, ensuring fresh data fetch
  // Always render Marketplace for 'browse' or any other non-staking tab
  return <Marketplace key={currentSubTab} />;
};

export default MarketplaceView;