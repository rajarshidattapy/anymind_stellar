import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import LandingPage from './pages/LandingPage';
import MainApp from './pages/MainApp';
import DevelopersPage from './pages/DevelopersPage';

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/marketplace" element={<MainApp />} />
            <Route path="/app" element={<MainApp />} />
            <Route path="/app/*" element={<MainApp />} />
            <Route path="/developers" element={<DevelopersPage />} />
          </Routes>
        </div>
      </Router>
    </WalletContextProvider>
  );
}

export default App;