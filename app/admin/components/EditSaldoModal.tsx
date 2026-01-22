'use client';

import { useState, FormEvent } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface EditSaldoModalProps {
  isOpen: boolean;
  userId: string;
  username: string;
  currentBalance: number;
  onClose: () => void;
  onSave: (newBalance: number) => Promise<boolean>;
}

export default function EditSaldoModal({
  isOpen,
  userId,
  username,
  currentBalance,
  onClose,
  onSave,
}: EditSaldoModalProps) {
  const [newBalance, setNewBalance] = useState(currentBalance.toString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const balance = parseFloat(newBalance);
    if (isNaN(balance)) {
      setError('Balance must be a valid number');
      return;
    }

    if (balance < 0) {
      setError('Balance cannot be negative');
      return;
    }

    setLoading(true);
    const success = await onSave(balance);
    setLoading(false);

    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setNewBalance(currentBalance.toString());
    setError('');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Edit Saldo</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded-lg transition disabled:cursor-not-allowed"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-semibold text-gray-900">{userId}</p>
              <p className="text-sm text-gray-600 mt-3">Username</p>
              <p className="font-semibold text-gray-900">{username}</p>
            </div>

            {/* Current Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance
              </label>
              <div className="p-3 bg-gray-100 rounded-lg text-gray-900 font-semibold">
                Rp {currentBalance.toLocaleString('id-ID')}
              </div>
            </div>

            {/* New Balance */}
            <div>
              <label htmlFor="newBalance" className="block text-sm font-medium text-gray-700 mb-2">
                New Balance
              </label>
              <input
                type="number"
                id="newBalance"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                disabled={loading}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Enter new balance"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter amount in Rupiah</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0" size={18} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Change Preview */}
            {!error && newBalance && !isNaN(parseFloat(newBalance)) && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p className="text-gray-700">
                  Change: <span className="font-semibold text-blue-600">
                    {parseFloat(newBalance) > currentBalance ? '+' : ''}
                    Rp {(parseFloat(newBalance) - currentBalance).toLocaleString('id-ID')}
                  </span>
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
