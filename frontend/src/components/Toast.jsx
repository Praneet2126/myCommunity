import { useEffect } from 'react';

/**
 * Toast notification component for showing error/success messages
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message
 * @param {string} props.type - Toast type ('error' or 'success')
 * @param {Function} props.onClose - Callback when toast is closed
 */
function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' 
    ? 'bg-red-500' 
    : 'bg-green-500';
  
  const iconColor = type === 'error' 
    ? 'text-red-100' 
    : 'text-green-100';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 min-w-[320px] max-w-[500px] animate-slide-in`}>
      {/* Icon */}
      <div className={`flex-shrink-0 w-6 h-6 ${iconColor}`}>
        {type === 'error' ? (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      
      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      
      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="flex-shrink-0 hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-white/20"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
