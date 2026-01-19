import { useState } from 'react';

/**
 * AI Chat Summary Modal
 * Displays a dialog to generate AI-powered chat summaries
 */
function AIRecommendationModal({ isOpen, onClose, messages = [] }) {
  const [step, setStep] = useState('confirm'); // 'confirm', 'loading', 'results'
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setStep('loading');
    setError(null);

    try {
      // Extract text content from messages
      const formattedMessages = messages
        .map(msg => msg.content || msg.text || '')
        .filter(text => text.trim());

      // Call AI Service API
      const response = await fetch('http://localhost:8001/api/v1/chat/summarize-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setStep('results');
    } catch (err) {
      console.error('Error generating summary:', err);
      setError(err.message || 'Failed to generate summary. Please try again.');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setData(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Summary</h2>
                <p className="text-blue-100 text-sm">Extract key points from your conversation</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="p-6">
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">Generate Summary</h3>
              <p className="text-gray-600 mb-4">
                Our AI will analyze your chat conversation and extract the summary
              </p>
              
              <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                📊 Analyzing {messages.length} messages
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate
              </button>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === 'loading' && (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 text-lg">Analyzing conversation...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && data && (
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Key Points Section */}
            {data.key_points && data.key_points.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-bold text-gray-800">Key Points</h3>
                  <span className="text-sm text-gray-500">({data.key_points.length})</span>
                </div>
                <div className="space-y-2">
                  {data.key_points.map((point, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="flex-1 text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No key points found in the conversation.
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIRecommendationModal;
