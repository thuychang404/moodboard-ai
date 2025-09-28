// frontend/src/components/MicrophonePermissionGuide.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mic, Lock, Info, CheckCircle, AlertCircle } from 'lucide-react';

export const MicrophonePermissionGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
      >
        <Info size={16} />
        {showGuide ? 'Hide' : 'Show'} Voice Input Guide & Privacy Info
      </button>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4"
          >
            {/* Privacy Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-green-600" size={18} />
                <span className="font-semibold text-blue-800">Your Privacy is Protected</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Processing happens in your browser only</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>No audio data sent to servers</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Only text transcript is used</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle size={16} className="text-green-600" />
                    <span>Revoke access anytime</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Setup Instructions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mic className="text-blue-600" size={18} />
                <span className="font-semibold text-blue-800">How to Enable Voice Input:</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Click the Microphone Button</div>
                    <div className="text-sm text-gray-600">Look for the microphone icon in the text input area</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Allow Microphone Access</div>
                    <div className="text-sm text-gray-600">Your browser will ask for permission - click "Allow"</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Start Speaking</div>
                    <div className="text-sm text-gray-600">Speak clearly and naturally - your words will appear as text</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Review and Analyze</div>
                    <div className="text-sm text-gray-600">Edit the text if needed, then click "Generate MoodBoard"</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" size={16} />
                <span className="font-semibold text-yellow-800">Tips for Best Results:</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1 ml-6">
                <li>• Speak in a quiet environment</li>
                <li>• Use your device's built-in microphone or a quality headset</li>
                <li>• Speak at a normal pace and volume</li>
                <li>• Pause briefly between sentences</li>
                <li>• If recognition stops, just click the microphone again</li>
              </ul>
            </div>

            {/* Troubleshooting */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="font-semibold text-gray-800 mb-2">Troubleshooting Common Issues:</div>
              <div className="space-y-2 text-sm text-gray-700">
                <div>
                  <strong>❌ "Microphone access denied":</strong> Check browser permissions and reload the page
                </div>
                <div>
                  <strong>❌ "No speech detected":</strong> Ensure your microphone is working and try speaking louder
                </div>
                <div>
                  <strong>❌ "Not working in this browser":</strong> Switch to Chrome or Edge for best compatibility
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MicrophonePermissionGuide;