import React from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface OfflineMessageProps {
  isOffline: boolean;
}

const OfflineMessage: React.FC<OfflineMessageProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 shadow-lg">
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Backend Unavailable
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              This is a demo version. For full functionality, run the backend server locally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineMessage;
