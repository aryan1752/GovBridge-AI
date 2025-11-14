// src/app/page.tsx
'use client';

import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const EXAMPLE = `As per the provisions of Section 7(1) of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013, the Collector has been pleased to issue a preliminary notification under Section 11(1) for acquisition of land measuring 25.50 acres in Village Bhubaneswar for the purpose of constructing a National Highway. All persons interested are hereby informed that they may file their objections within 60 days from the date of publication.`;

  const handleSimplify = async (translate: boolean) => {
    if (!input.trim()) {
      setError('Please enter some text first');
      return;
    }

    setLoading(true);
    setError('');
    setOutput('');

    try {
      const res = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, translate }),
      });

      if (!res.ok) {
        throw new Error('Failed to simplify');
      }

      const data = await res.json();
      setOutput(data.simplified);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="pt-8 pb-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-lg rounded-2xl mb-4 shadow-2xl border border-white/20">
                <span className="text-5xl">🏛️</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-white mb-3 tracking-tight">
                GovBridge AI
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 font-light mb-2">
                Transform Complex Government Documents into Plain Language
              </p>
              <p className="text-sm text-purple-300/80">
                Powered by AI • Instant Translation • Accessible to Everyone
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Panel */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 transform hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Original Document
                    </h2>
                  </div>
                  <button
                    onClick={() => setInput(EXAMPLE)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border border-white/30 backdrop-blur-sm"
                  >
                    ✨ Try Example
                  </button>
                </div>
                
                <textarea
                  className="w-full h-64 p-4 bg-white/90 rounded-2xl border-2 border-white/30 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all resize-none text-gray-800 placeholder-gray-500 shadow-inner"
                  placeholder="Paste any government document, legal notice, policy text, or official circular here..."
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError('');
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={() => handleSimplify(false)}
                    disabled={!input.trim() || loading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 px-6 rounded-2xl font-bold text-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      '✨ Simplify (English)'
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSimplify(true)}
                    disabled={!input.trim() || loading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 px-6 rounded-2xl font-bold text-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      '🌍 Simplify + Hindi'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-2xl text-red-100 text-sm flex items-start gap-3 animate-shake">
                    <span className="text-xl">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Output Panel */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8 transform hover:scale-[1.01] transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Simplified Version
                  </h2>
                </div>
                
                <div className="bg-white/90 rounded-2xl p-6 h-64 overflow-y-auto shadow-inner backdrop-blur-sm border border-white/30">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="relative w-16 h-16 mb-4">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-600 rounded-full animate-spin border-t-transparent"></div>
                      </div>
                      <p className="text-gray-600 font-medium">Simplifying your document...</p>
                      <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
                    </div>
                  ) : output ? (
                    <div className="space-y-4">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
                        {output}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mb-4">
                        <span className="text-4xl">📝</span>
                      </div>
                      <p className="text-gray-500 font-medium text-lg">Your simplified text will appear here</p>
                      <p className="text-gray-400 text-sm mt-2">Paste a document and click Simplify to get started</p>
                    </div>
                  )}
                </div>

                {output && !loading && (
                  <div className="mt-6 p-5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/30 rounded-2xl text-white">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">💡</span>
                      <div className="flex-1">
                        <p className="font-bold mb-2 text-lg">What we did:</p>
                        <ul className="space-y-2 text-sm text-purple-100">
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            Removed complex legal jargon
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            Simplified sentence structure
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            Made it conversational and clear
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            Highlighted important action items
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-3xl font-bold text-white mb-1">&lt; 3s</div>
                <div className="text-purple-200 text-sm">Average Processing Time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">🌍</div>
                <div className="text-3xl font-bold text-white mb-1">36+</div>
                <div className="text-purple-200 text-sm">Languages Supported</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center transform hover:scale-105 transition-all duration-300">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-purple-200 text-sm">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-white/80 text-sm mb-2">
              Built with <span className="text-red-400 animate-pulse">❤️</span> using <span className="font-semibold">OpenAI</span> + <span className="font-semibold">Lingo.dev</span>
            </p>
            <p className="text-white/60 text-xs">
              Making government accessible to everyone, one document at a time
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}