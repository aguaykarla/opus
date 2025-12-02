import React, { useState, useRef, useEffect } from 'react';
import { Target, Sparkles, Flame, CloudRain, Smile, Clock, TrendingUp, Camera, Plus, X, Zap, Heart } from 'lucide-react';

export default function OpusMVP() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentMode, setCurrentMode] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const [goals, setGoals] = useState([]);
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: '',
    dueDate: '',
    progress: '',
    feeling: '',
    notes: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => setShowSplash(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setCurrentMode('canvas');
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeArtwork = async () => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);

    try {
      const base64Data = uploadedImage.split(',')[1];
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAjlGVp3nIf3ICAxBA7BK06ZJt9HAD60cU';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Analyze this artwork. Provide:\n1. ONE WORD essence\n2. Three specific strengths\n3. One technique to explore\n4. A creative challenge\n\nBe enthusiastic and specific!' },
                { inline_data: { mime_type: 'image/jpeg', data: base64Data } }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.error) {
        console.error('API Error:', data.error);
        setAnalysis({ feedback: `Error: ${data.error.message}` });
      } else {
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Beautiful work!';
        setAnalysis({ feedback });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis({ feedback: 'Connection issue - check console for details!' });
    }
    setIsAnalyzing(false);
  };

  const createGoal = async () => {
    if (!newGoal.title || !newGoal.dueDate || !newGoal.feeling) return;

    setIsAnalyzing(true);
    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAjlGVp3nIf3ICAxBA7BK06ZJt9HAD60cU';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `I'm working on: "${newGoal.title}" (${newGoal.type})\nDue: ${newGoal.dueDate}\nProgress: ${newGoal.progress}\nFeeling: ${newGoal.feeling}\nNotes: ${newGoal.notes}\n\nGive me 3 specific micro-actions to take this week. Be concrete and actionable. Number them 1-3.`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      console.log('Goal API Response:', data);
      
      let suggestions = 'Break it into smaller steps!';
      if (data.error) {
        console.error('API Error:', data.error);
        suggestions = `Error: ${data.error.message}`;
      } else {
        suggestions = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Break it into smaller steps!';
      }
      
      const goalWithSuggestions = {
        ...newGoal,
        id: Date.now(),
        suggestions,
        createdAt: new Date().toLocaleDateString()
      };

      setGoals([...goals, goalWithSuggestions]);
      setNewGoal({ title: '', type: '', dueDate: '', progress: '', feeling: '', notes: '' });
      setCreatingGoal(false);
    } catch (error) {
      console.error('Goal error:', error);
    }
    setIsAnalyzing(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || 'AIzaSyAjlGVp3nIf3ICAxBA7BK06ZJt9HAD60cU';
      
      const conversationHistory = chatMessages.map(msg => 
        msg.role === 'user' ? `Student: ${msg.content}` : `Opus: ${msg.content}`
      ).join('\n');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are Opus, a warm and encouraging art mentor for young artists, especially those from underrepresented communities and with special needs. 

Previous conversation:
${conversationHistory}

Initial artwork feedback: ${analysis?.feedback || 'We just started talking'}

Student says: ${chatInput}

Respond with warmth, encouragement, and specific guidance. Be patient, affirming, and help them grow their skills and confidence. Keep responses conversational and supportive (2-4 sentences).`
              }]
            }]
          })
        }
      );

      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to support you! Tell me more about your creative journey.";
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now, but I'm here for you!" }]);
    }
    setIsChatting(false);
  };

  const getFeelingEmoji = (feeling) => {
    const map = {
      'confident': '🔥',
      'stuck': '🌧️',
      'excited': '✨',
      'overwhelmed': '😰',
      'motivated': '💪',
      'curious': '🤔'
    };
    return map[feeling] || '😊';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-cyan-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Poppins:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&display=swap');
        
        body, * { 
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        .heading { 
          font-family: 'Oswald', sans-serif !important;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .italic-accent { 
          font-family: 'Cormorant Garamond', Georgia, serif !important;
          font-style: italic !important;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }

        .float { animation: float 4s ease-in-out infinite; }
        .rotate-slow { animation: rotate 20s linear infinite; }
        .slide-up { animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .scale-in { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .fade-in { animation: fadeIn 1s ease-out; }
        .wiggle { animation: wiggle 2s ease-in-out infinite; }

        .blob {
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          transition: all 0.5s ease-in-out;
        }

        .blob:hover {
          border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%;
          transform: scale(1.05);
        }

        .card-tilt {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .card-tilt:hover {
          transform: translateY(-12px) rotate(-2deg);
        }

        .gradient-yellow { 
          background: linear-gradient(135deg, #f4face 0%, #c8cd0f 100%) !important;
        }
        .gradient-pink { 
          background: linear-gradient(135deg, #ffb7e4 0%, #f4face 100%) !important;
        }
        .gradient-blue { 
          background: linear-gradient(135deg, #bee2f0 0%, #ffb7e4 100%) !important;
        }
        .gradient-lime { 
          background: linear-gradient(135deg, #c8cd0f 0%, #bee2f0 100%) !important;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #ffb7e4 0%, #c8cd0f 50%, #bee2f0 100%);
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
          color: transparent !important;
        }
      `}</style>

      {/* SPLASH */}
      {showSplash && (
        <div className="fixed inset-0 z-50 gradient-pink flex items-center justify-center fade-in">
          <div className="text-center">
            <div className="mb-8 wiggle">
              <Sparkles className="w-24 h-24 text-white mx-auto" strokeWidth={1.5} />
            </div>
            <h1 className="text-9xl font-bold text-white mb-4 tracking-tight heading">OPUS</h1>
            <p className="text-3xl text-white italic-accent">where creativity meets growth</p>
          </div>
        </div>
      )}

      {!showSplash && !currentMode && (
        <div className="min-h-screen p-8 lg:p-16">
          <div className="max-w-7xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-12 lg:mb-20 slide-up">
              <h1 className="text-4xl sm:text-5xl lg:text-8xl font-bold mb-4 lg:mb-6 heading gradient-text px-4">
                What will you be working on today?
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 italic-accent max-w-3xl mx-auto px-4">
                Analyze your art, track your projects, and watch your art flourish
              </p>
            </div>

            <div className="relative">

              <div className="hidden lg:block absolute top-0 left-10 w-32 h-32 gradient-yellow blob opacity-20 float" style={{animationDelay: '0s'}}></div>
              <div className="hidden lg:block absolute bottom-20 right-10 w-40 h-40 gradient-blue blob opacity-20 float" style={{animationDelay: '1s'}}></div>
              
              <div className="grid lg:grid-cols-12 gap-8 relative z-10">

                <div 
                  className="lg:col-span-7 card-tilt cursor-pointer scale-in"
                  style={{animationDelay: '0.1s'}}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="gradient-pink rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute top-8 right-8 w-24 h-24 bg-white bg-opacity-20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-full flex items-center justify-center mb-6 lg:mb-8 group-hover:scale-110 transition-transform shadow-xl">
                        <Camera className="w-8 h-8 lg:w-12 lg:h-12 text-pink-500" strokeWidth={2} />
                      </div>
                      <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4 lg:mb-6 heading">CANVAS MODE</h2>
                      <p className="text-lg lg:text-2xl text-white leading-relaxed mb-6 lg:mb-8 italic-accent">
                        Upload your artwork and receive deep visual analysis with actionable creative feedback
                      </p>
                      <div className="flex items-center gap-3 text-white text-lg lg:text-xl font-semibold">
                        <span>Upload Now</span>
                        <Zap className="w-5 h-5 lg:w-6 lg:h-6" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className="lg:col-span-5 lg:mt-16 card-tilt cursor-pointer scale-in"
                  style={{animationDelay: '0.3s'}}
                  onClick={() => setCurrentMode('goals')}
                >
                  <div className="gradient-blue rounded-[3rem] lg:rounded-[4rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group h-full">
                    <div className="absolute bottom-8 left-8 w-20 h-20 bg-white bg-opacity-20 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform shadow-xl">
                        <Target className="w-8 h-8 lg:w-10 lg:h-10 text-cyan-600" strokeWidth={2} />
                      </div>
                      <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 lg:mb-5 heading">GOAL STUDIO</h2>
                      <p className="text-lg lg:text-xl text-white leading-relaxed mb-4 lg:mb-6 italic-accent">
                        Set creative goals, track emotional progress, and get personalized action steps
                      </p>
                      <div className="flex items-center gap-3 text-white text-base lg:text-lg font-semibold">
                        <span>Start Planning</span>
                        <Heart className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Accent Card */}
              <div className="mt-8 scale-in" style={{animationDelay: '0.5s'}}>
                <div className="gradient-lime rounded-[4rem] p-8 shadow-xl text-center">
                  <p className="text-2xl text-white font-semibold italic-accent">
                    Created by Karla, Rhea, and Amrita | Dedicated to motivating young creatives everywhere
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* CANVAS MODE */}
      {currentMode === 'canvas' && (
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => {
                setCurrentMode(null);
                setUploadedImage(null);
                setAnalysis(null);
              }}
              className="mb-8 px-8 py-4 gradient-yellow rounded-full text-gray-800 font-bold hover:shadow-2xl transition-all"
            >
              ← Back Home
            </button>

            {!analysis ? (
              <div className="grid lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 scale-in">
                  <div className="bg-white rounded-[4rem] p-8 shadow-2xl">
                    <img src={uploadedImage} alt="Artwork" className="w-full rounded-[3rem] shadow-lg" />
                  </div>
                </div>
                <div className="lg:col-span-2 flex flex-col justify-center slide-up">
                  <h2 className="text-6xl font-bold mb-6 heading gradient-text">
                    YOUR CANVAS
                  </h2>
                  <p className="text-2xl text-gray-700 mb-10 italic-accent leading-relaxed">
                    Ready to explore what makes your art unique?
                  </p>
                  <button
                    onClick={analyzeArtwork}
                    disabled={isAnalyzing}
                    className="gradient-pink text-white py-7 rounded-full text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing Artwork...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                        Analyze Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-5 gap-6 scale-in">
                {/* Artwork stays visible */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-6 shadow-2xl">
                  <img src={uploadedImage} alt="Artwork" className="w-full rounded-[2rem] shadow-lg" />
                </div>

                {/* Feedback + Chat */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Initial Feedback */}
                  <div className="gradient-blue rounded-[3rem] p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                        <Sparkles className="w-8 h-8 text-cyan-600" />
                      </div>
                      <h3 className="text-4xl font-bold text-white heading">OPUS SAYS</h3>
                    </div>
                    <div className="bg-white bg-opacity-90 rounded-[2rem] p-6">
                      <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {analysis.feedback}
                      </p>
                    </div>
                  </div>

                  {/* Chat with Opus */}
                  <div className="bg-white rounded-[3rem] p-8 shadow-2xl">
                    <h4 className="text-2xl font-bold text-gray-900 mb-6 heading flex items-center gap-3">
                      <Heart className="w-7 h-7 text-pink-500" />
                      Continue the Conversation
                    </h4>

                    {/* Chat Messages */}
                    <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-6 py-4 rounded-[2rem] ${
                            msg.role === 'user' 
                              ? 'gradient-pink text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isChatting && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-6 py-4 rounded-[2rem]">
                            <div className="flex gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Ask Opus anything about your art..."
                        className="flex-1 px-6 py-4 rounded-full border-4 border-pink-200 focus:border-pink-400 focus:outline-none"
                        disabled={isChatting}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={!chatInput.trim() || isChatting}
                        className="gradient-pink text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOAL STUDIO */}
      {currentMode === 'goals' && (
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <button
                onClick={() => setCurrentMode(null)}
                className="px-8 py-4 gradient-yellow rounded-full text-gray-800 font-bold hover:shadow-2xl transition-all"
              >
                ← Back Home
              </button>
              <button
                onClick={() => setCreatingGoal(true)}
                className="gradient-pink text-white px-10 py-5 rounded-full font-bold text-xl flex items-center gap-3 hover:shadow-2xl transition-all"
              >
                <Plus className="w-7 h-7" strokeWidth={3} />
                New Goal
              </button>
            </div>

            {/* Goal Creation Modal */}
            {creatingGoal && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-8 fade-in">
                <div className="bg-white rounded-[4rem] p-12 max-w-4xl w-full shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-5xl font-bold heading gradient-text">
                      CREATE YOUR GOAL
                    </h3>
                    <button onClick={() => setCreatingGoal(false)} className="p-3 hover:bg-gray-100 rounded-full transition-colors">
                      <X className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-xl font-bold text-gray-800 mb-4 heading">Project Title</label>
                      <input
                        type="text"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                        placeholder="e.g., Portrait Series, Digital Landscape Collection"
                        className="w-full px-8 py-5 rounded-full border-4 border-pink-200 focus:border-pink-400 focus:outline-none text-lg"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-xl font-bold text-gray-800 mb-4 heading">Project Type</label>
                        <select
                          value={newGoal.type}
                          onChange={(e) => setNewGoal({...newGoal, type: e.target.value})}
                          className="w-full px-8 py-5 rounded-full border-4 border-pink-200 focus:border-pink-400 focus:outline-none text-lg"
                        >
                          <option value="">Select type...</option>
                          <option value="painting">Painting</option>
                          <option value="digital">Digital Art</option>
                          <option value="sketch">Sketching</option>
                          <option value="sculpture">Sculpture</option>
                          <option value="photography">Photography</option>
                          <option value="mixed">Mixed Media</option>
                          <option value="mixed">Oil Pastel</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xl font-bold text-gray-800 mb-4 heading">Due Date</label>
                        <input
                          type="date"
                          value={newGoal.dueDate}
                          onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
                          className="w-full px-8 py-5 rounded-full border-4 border-pink-200 focus:border-pink-400 focus:outline-none text-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-gray-800 mb-4 heading">Current Progress</label>
                      <select
                        value={newGoal.progress}
                        onChange={(e) => setNewGoal({...newGoal, progress: e.target.value})}
                        className="w-full px-8 py-5 rounded-full border-4 border-pink-200 focus:border-pink-400 focus:outline-none text-lg"
                      >
                        <option value="">Select progress...</option>
                        <option value="not-started">Haven't started yet</option>
                        <option value="planning">In planning phase</option>
                        <option value="early">Just getting started</option>
                        <option value="halfway">About halfway through</option>
                        <option value="finalizing">Final touches</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-gray-800 mb-4 heading">How Are You Feeling?</label>
                      <div className="grid grid-cols-3 gap-5">
                        {[
                          {value: 'confident', icon: Flame, label: 'On Fire', gradient: 'gradient-yellow'},
                          {value: 'stuck', icon: CloudRain, label: 'Stuck', gradient: 'gradient-blue'},
                          {value: 'excited', icon: Sparkles, label: 'Excited', gradient: 'gradient-pink'},
                          {value: 'overwhelmed', icon: Target, label: 'Overwhelmed', gradient: 'gradient-lime'},
                          {value: 'motivated', icon: TrendingUp, label: 'Motivated', gradient: 'gradient-yellow'},
                          {value: 'curious', icon: Smile, label: 'Curious', gradient: 'gradient-blue'}
                        ].map(feeling => (
                          <button
                            key={feeling.value}
                            onClick={() => setNewGoal({...newGoal, feeling: feeling.value})}
                            className={`p-6 rounded-[2rem] border-4 transition-all ${
                              newGoal.feeling === feeling.value 
                                ? `${feeling.gradient} text-white border-transparent shadow-xl scale-105` 
                                : 'border-gray-200 hover:border-gray-400 bg-white'
                            }`}
                          >
                            <feeling.icon className={`w-8 h-8 mx-auto mb-3 ${newGoal.feeling === feeling.value ? 'text-white' : 'text-gray-600'}`} />
                            <span className={`text-base font-bold ${newGoal.feeling === feeling.value ? 'text-white' : 'text-gray-700'}`}>
                              {feeling.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xl font-bold text-gray-800 mb-4 heading">Additional Notes (Optional)</label>
                      <textarea
                        value={newGoal.notes}
                        onChange={(e) => setNewGoal({...newGoal, notes: e.target.value})}
                        placeholder="Any challenges, inspirations, or thoughts?"
                        rows="4"
                        className="w-full px-8 py-5 rounded-[2rem] border-4 border-pink-200 focus:border-pink-400 focus:outline-none text-lg resize-none"
                      />
                    </div>

                    <button
                      onClick={createGoal}
                      disabled={isAnalyzing || !newGoal.title || !newGoal.dueDate || !newGoal.feeling}
                      className="w-full gradient-pink text-white py-7 rounded-full text-2xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-7 h-7" />
                          Create Goal & Get Action Steps
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Goals Display */}
            {goals.length === 0 ? (
              <div className="text-center py-24 fade-in">
                <Target className="w-28 h-28 mx-auto text-gray-300 mb-8" />
                <h3 className="text-5xl font-bold text-gray-400 mb-5 heading">No Goals Yet</h3>
                <p className="text-2xl text-gray-500 italic-accent">Create your first creative project goal</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {goals.map((goal, idx) => (
                  <div key={goal.id} className="gradient-blue rounded-[4rem] p-10 shadow-2xl scale-in" style={{animationDelay: `${idx * 0.15}s`}}>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h4 className="text-4xl font-bold text-white mb-3 heading">{goal.title}</h4>
                        <div className="flex items-center gap-5 text-white">
                          <span className="text-xl font-semibold">{goal.type}</span>
                          <span className="text-4xl">{getFeelingEmoji(goal.feeling)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-4 text-white">
                        <Clock className="w-6 h-6" />
                        <span className="font-bold text-lg">Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4 text-white">
                        <TrendingUp className="w-6 h-6" />
                        <span className="font-bold text-lg">Progress: {goal.progress.replace('-', ' ')}</span>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-90 rounded-[3rem] p-8">
                      <h5 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3 heading">
                        <Sparkles className="w-6 h-6 text-pink-500" />
                        YOUR ACTION STEPS
                      </h5>
                      <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                        {goal.suggestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}