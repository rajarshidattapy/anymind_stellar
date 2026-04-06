import { useState } from 'react';
import { FileText, Sparkles, Shield } from 'lucide-react';

const ImportChats = () => {
  const [chatContent, setChatContent] = useState('');
  const [capsuleName, setCapsuleName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState('private');

  const categories = [
    'Finance', 'Gaming', 'Health', 'Technology', 'Education', 
    'Marketing', 'Legal', 'Design', 'Science', 'Business'
  ];

  const handleCreateCapsule = () => {
    // Handle capsule creation logic here
    console.log({
      content: chatContent,
      name: capsuleName,
      category: selectedCategory,
      privacy: privacyLevel
    });
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Import Existing Chats</h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Paste any prior AI conversation or notes you want this agent to learn from. 
            Transform your existing knowledge into a memory capsule.
          </p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Chat Content
                </label>
                <textarea
                  value={chatContent}
                  onChange={(e) => setChatContent(e.target.value)}
                  placeholder="Paste your AI conversation or notes here..."
                  className="w-full h-64 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
                <div className="text-xs text-gray-500 mt-2">
                  {chatContent.length} characters • Recommended: 500+ characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Capsule Name
                </label>
                <input
                  type="text"
                  value={capsuleName}
                  onChange={(e) => setCapsuleName(e.target.value)}
                  placeholder="e.g., Marketing Strategy Assistant"
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Privacy Level
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="private"
                      name="privacy"
                      value="private"
                      checked={privacyLevel === 'private'}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor="private" className="text-white">
                      Private - Only you can access
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="public"
                      name="privacy"
                      value="public"
                      checked={privacyLevel === 'public'}
                      onChange={(e) => setPrivacyLevel(e.target.value)}
                      className="mr-3"
                    />
                    <label htmlFor="public" className="text-white">
                      Public - Available on marketplace
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Processing Preview</h3>
                </div>
                
                {chatContent ? (
                  <div className="space-y-3">
                    <div className="bg-gray-600 rounded p-3">
                      <div className="text-sm text-gray-400 mb-1">Detected Patterns:</div>
                      <div className="text-white text-sm">
                        • {Math.floor(chatContent.length / 100)} conversation turns
                      </div>
                      <div className="text-white text-sm">
                        • {Math.floor(Math.random() * 20 + 10)} key concepts
                      </div>
                      <div className="text-white text-sm">
                        • {Math.floor(Math.random() * 15 + 5)} decision patterns
                      </div>
                    </div>
                    
                    <div className="bg-green-600 bg-opacity-20 border border-green-600 rounded p-3">
                      <div className="text-green-400 text-sm font-medium">
                        ✓ Ready for processing
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Paste content to see processing preview
                  </div>
                )}
              </div>

              <div className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Supported Formats</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• ChatGPT conversation exports</div>
                  <div>• GPT conversation history</div>
                  <div>• Raw chat transcripts</div>
                  <div>• Structured Q&A documents</div>
                  <div>• Meeting notes with decisions</div>
                </div>
              </div>

              <div className="bg-blue-600 bg-opacity-10 border border-blue-500 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-400">Privacy Notice</h3>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• We do not store or resell raw transcripts</div>
                  <div>• Content is processed into structured memory</div>
                  <div>• Original text is discarded after processing</div>
                  <div>• Only reasoning patterns are retained</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              onClick={handleCreateCapsule}
              disabled={!chatContent.trim() || !capsuleName.trim() || !selectedCategory}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Memory Capsule
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Best Practices</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div>• Include context for decisions and reasoning</div>
              <div>• Provide examples of successful strategies</div>
              <div>• Include both questions and detailed answers</div>
              <div>• Focus on evergreen knowledge vs time-sensitive info</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quality Guidelines</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div>• Minimum 500 characters for meaningful patterns</div>
              <div>• Clear, well-structured conversations work best</div>
              <div>• Multiple examples improve capsule quality</div>
              <div>• Domain expertise becomes more valuable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportChats;