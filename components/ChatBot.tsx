import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToChat } from '../services/geminiService';
import { Button } from './common/Button';
import { SendIcon, SparklesIcon } from './common/Icons';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hi there! I'm Sparky. What do you want to talk about?" }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmedInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const botResponse = await sendMessageToChat(trimmedInput);
      setMessages([...newMessages, { role: 'model', text: botResponse }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[65vh] max-w-2xl mx-auto bg-white/50 rounded-2xl shadow-lg">
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white shrink-0">
                <SparklesIcon />
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-slate-700 rounded-bl-none shadow'
              }`}
            >
              <p className="text-base">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
             <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white shrink-0">
                <SparklesIcon />
              </div>
            <div className="max-w-xs md:max-w-md p-3 rounded-2xl bg-white text-slate-700 rounded-bl-none shadow">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-0"></span>
                <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-purple-300 rounded-full animate-pulse delay-300"></span>
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-center text-red-500 font-semibold">{error}</p>}
      </div>

      <div className="p-4 border-t border-blue-200/50 bg-white/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sparky a question..."
            className="flex-grow w-full p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
