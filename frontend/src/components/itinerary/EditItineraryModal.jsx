import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateItinerary } from '../../services/itineraryService';

function EditItineraryModal({ itinerary, onClose, onSave }) {
  const { token } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: itinerary.title || '',
    notes: itinerary.notes || ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateItinerary(itinerary._id, formData, token);
      onSave();
    } catch (error) {
      alert(error.message || 'Failed to update itinerary');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Itinerary</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4169e1] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4169e1] focus:border-transparent"
                placeholder="Add any notes about this itinerary..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-[#4169e1] text-white py-2 rounded-lg font-semibold hover:bg-[#4169e1]/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditItineraryModal;
