import { useState, useRef, useEffect } from 'react';
import { Info, Copy, Check } from 'lucide-react';

interface InfoIconProps {
  id: string;
  label?: string;
  className?: string;
}

const InfoIcon: React.FC<InfoIconProps> = ({ id, label = 'ID', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-blue-400 transition-colors"
        title={`Show ${label}`}
      >
        <Info className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 left-0">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">{label}:</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <code className="flex-1 text-xs text-gray-300 bg-gray-900 px-2 py-1.5 rounded break-all">
              {id}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center w-7 h-7 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              title="Copy ID"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoIcon;

