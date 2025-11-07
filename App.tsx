import React, { useState } from 'react';
import StoryViewer from './components/StoryViewer';
import ChatBot from './components/ChatBot';
import { BookIcon, ChatBubbleIcon } from './components/common/Icons';

type View = 'story' | 'chat';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('story');

  const navButtonClasses = (view: View) => 
    `flex items-center gap-2 px-4 py-3 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 ${
      activeView === view 
        ? 'bg-white text-blue-600 shadow-md' 
        : 'bg-white/50 text-blue-500 hover:bg-white'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 text-slate-800 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-200/50 overflow-hidden">
        <header className="p-4 bg-white/50 border-b border-blue-200/50">
          <h1 className="text-3xl sm:text-4xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Story Time AI
          </h1>
          <nav className="mt-4 flex justify-center items-center gap-4">
            <button onClick={() => setActiveView('story')} className={navButtonClasses('story')}>
              <BookIcon />
              Story Time
            </button>
            <button onClick={() => setActiveView('chat')} className={navButtonClasses('chat')}>
              <ChatBubbleIcon />
              Chat with Sparky
            </button>
          </nav>
        </header>

        <main className="p-4 sm:p-6">
          {activeView === 'story' && <StoryViewer />}
          {activeView === 'chat' && <ChatBot />}
        </main>
      </div>
       <footer className="text-center p-4 mt-4 text-sm text-slate-500">
            <p>Crafted with fun for kids by a world-class React engineer.</p>
        </footer>
    </div>
  );
};

export default App;
