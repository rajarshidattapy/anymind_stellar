import React from 'react';
import WalletBalance from './WalletBalance';
import EarningsDashboard from './EarningsDashboard';

interface WalletViewProps {
  activeSubTab: string;
}

const WalletView: React.FC<WalletViewProps> = ({ activeSubTab }) => {
  if (activeSubTab === 'earnings') {
    return <EarningsDashboard />;
  }
  
  return <WalletBalance />;
};

export default WalletView;