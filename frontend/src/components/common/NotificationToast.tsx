import  { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useEffect } from 'react';

const NotificationToast = () => {
  const { toasts, removeToast } = useNotification();

  useEffect(() => {
    // Clean up any toasts when component unmounts
    return () => {
      toasts.forEach(toast => removeToast(toast.id));
    };
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderClass = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
      default:
        return 'border-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md space-y-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`rounded-lg shadow-md p-4 flex items-start space-x-3 animate-fade-in border ${getBorderClass(toast.type)} bg-white`}
        >
          <div className="flex-shrink-0">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800">{toast.message}</p>
          </div>
          <button
            type="button"
            className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={() => removeToast(toast.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
 