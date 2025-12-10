
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';
import { DoubtSolverResponse } from '../types';
import { createTutorChat } from '../services/geminiService';
import MathMarkdown from './MathMarkdown';
import { Chat, GenerateContentResponse } from '@google/genai';

interface TutorChatProps {
  data: DoubtSolverResponse;
  initialMessage?: string; // Allow external triggering
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const TutorChat: React.FC<TutorChatProps> = ({ data, initialMessage }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice Recognition Ref
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      const chat = createTutorChat({
        question: data.question_understanding.clean_question,
        solution: data.short_answer,
        level: data.difficulty.level
      });
      setChatSession(chat);
      setMessages([{ role: 'model', text: "Hi! I'm your AI Tutor. Ask me anything about this problem or if you need clarification on a step!" }]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, [data]);

  // Handle Initial Message Trigger (from Step Explanation)
  useEffect(() => {
    if (initialMessage && chatSession) {
      handleSend(initialMessage);
    }
  }, [initialMessage, chatSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Logic
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + " " + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
      } else {
        alert("Speech recognition not supported in this browser.");
      }
    }
  };

  const handleSend = async (msgOverride?: string) => {
    const textToSend = msgOverride || input;
    if (!textToSend.trim() || !chatSession) return;

    if (!msgOverride) setInput('');
    
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessageStream({ message: textToSend });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          setMessages(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { role: 'model', text: fullText };
            return newHistory;
          });
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/10 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="font-bold text-white">AI Tutor Chat</h3>
        {isListening && <span className="text-red-400 text-xs animate-pulse ml-auto">Listening...</span>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-500/20 text-white rounded-tr-sm' : 'bg-white/10 text-gray-200 rounded-tl-sm'}`}>
              <MathMarkdown text={msg.text} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            title="Voice Input"
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a follow-up..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorChat;
