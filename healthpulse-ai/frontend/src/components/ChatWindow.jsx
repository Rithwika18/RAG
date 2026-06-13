import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader, HelpCircle, Keyboard } from 'lucide-react';
import { SettingsContext } from '../context/SettingsContext';

export default function ChatWindow({ reportId, reportName }) {
  const { provider, model, getActiveApiKey, language } = useContext(SettingsContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const insertCharacter = (char) => {
    const inputEl = inputRef.current;
    if (!inputEl) {
      setInput(prev => prev + char);
      return;
    }

    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const text = inputEl.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setInput(before + char + after);
    
    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(start + char.length, start + char.length);
    }, 0);
  };

  const handleBackspace = () => {
    const inputEl = inputRef.current;
    if (!inputEl) {
      setInput(prev => prev.slice(0, -1));
      return;
    }

    const start = inputEl.selectionStart;
    const end = inputEl.selectionEnd;
    const text = inputEl.value;

    if (start === end) {
      if (start === 0) return;
      const before = text.substring(0, start - 1);
      const after = text.substring(end, text.length);
      setInput(before + after);
      setTimeout(() => {
        inputEl.focus();
        inputEl.setSelectionRange(start - 1, start - 1);
      }, 0);
    } else {
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setInput(before + after);
      setTimeout(() => {
        inputEl.focus();
        inputEl.setSelectionRange(start, start);
      }, 0);
    }
  };

  const getSuggestedQuestions = () => {
    if (language?.toLowerCase() === 'hindi') {
      return [
        'मेरी कोलेस्ट्रॉल रिपोर्ट का क्या मतलब है?',
        'हीमोग्लोबिन कम क्यों है?',
        'एचडीएल (HDL) क्या है?',
        'मुख्य सिफारिशें क्या हैं?'
      ];
    } else if (language?.toLowerCase() === 'telugu') {
      return [
        'నా కొలెస్ట్రాల్ రిపోర్ట్ అర్థం ఏమిటి?',
        'హిమోగ్లోబిన్ ఎందుకు తక్కువగా ఉంది?',
        'హెచ్‌డిఎల్ (HDL) అంటే ఏమిటి?',
        'ప్రధాన సిఫార్సులు ఏమిటి?'
      ];
    }
    return [
      'What does my cholesterol mean?',
      'Why is hemoglobin low?',
      'What is HDL?',
      'What are the key recommendations?'
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  const getKeyboardLayout = () => {
    if (language?.toLowerCase() === 'telugu') {
      return {
        title: 'Telugu Virtual Keyboard (తెలుగు కీబోర్డ్)',
        vowels: ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ', 'అం', 'అః'],
        consonants: [
          'క', 'ఖ', 'గ', 'ఘ', 'ఙ',
          'చ', 'ఛ', 'జ', 'ఝ', 'ఞ',
          'ట', 'ఠ', 'డ', 'ఢ', 'ణ',
          'త', 'థ', 'ద', 'ధ', 'న',
          'ప', 'ఫ', 'బ', 'భ', 'మ',
          'య', 'ర', 'ల', 'వ', 'శ', 'ష', 'స', 'హ', 'ళ', 'క్ష', 'ఱ'
        ],
        modifiers: ['ా', 'ి', 'ీ', 'ు', 'ూ', 'ృ', 'ె', 'ే', 'ై', 'ఒ', 'ో', 'ౌ', 'ం', 'ః', '్'],
        space: 'Space (ఖాళీ)',
        backspace: 'Backspace (వెనుకకు)',
        clear: 'Clear (తుడిచివేయి)'
      };
    }
    return {
      title: 'Hindi Virtual Keyboard (हिन्दी कीबोर्ड)',
      vowels: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
      consonants: [
        'क', 'ख', 'ग', 'घ', 'ङ',
        'च', 'छ', 'ज', 'झ', 'ञ',
        'ट', 'ठ', 'ड', 'ढ', 'ण',
        'त', 'थ', 'द', 'ध', 'न',
        'प', 'फ', 'ब', 'भ', 'म',
        'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ'
      ],
      modifiers: ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', 'ँ', '्'],
      space: 'Space (स्थान)',
      backspace: 'Backspace (हटाएं)',
      clear: 'Clear (साफ़ करें)'
    };
  };

  const getPlaceholder = () => {
    if (language?.toLowerCase() === 'hindi') {
      return "इस रिपोर्ट के बारे में प्रश्न पूछें (जैसे: मेरा हीमोग्लोबिन कम क्यों है?)...";
    } else if (language?.toLowerCase() === 'telugu') {
      return "ఈ రిపోర్టు గురించి ప్రశ్న అడగండి (ఉదా: నా హిమోగ్లోబిన్ ఎందుకు తక్కువగా ఉంది?)...";
    }
    return "Ask a question about this report (e.g. why is my hemoglobin low?)...";
  };

  // Fetch chat history
  useEffect(() => {
    if (!reportId) return;

    const fetchHistory = async () => {
      setFetchingHistory(true);
      try {
        const res = await axios.get(`/api/reports/${reportId}/chat`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load chat history', err);
      } finally {
        setFetchingHistory(false);
      }
    };

    fetchHistory();
  }, [reportId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading || !reportId) return;

    if (!textToSend) setInput('');

    // Optimistic User Message
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message: text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      // Direct call to spec POST /chat
      const res = await axios.post('/chat', {
        report_id: reportId,
        message: text,
        provider,
        model,
        api_key: getActiveApiKey(),
        language
      });

      const tempAiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        message: res.data.response,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempAiMsg]);
    } catch (err) {
      console.error(err);
      const tempErrorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        message: 'Failed to generate answer. Make sure key or local Ollama configurations are valid.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempErrorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear chat history?")) return;
    try {
      await axios.delete(`/api/reports/${reportId}/chat`);
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear chat history', err);
    }
  };

  if (!reportId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
        <Bot className="w-16 h-16 stroke-1 mb-4 text-brand-200" />
        <p className="text-sm font-semibold">Select a medical report from the Dashboard to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex flex-col bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider block">Context RAG Chat</span>
          <span className="text-sm font-bold text-slate-800 truncate max-w-[280px] block">{reportName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[10px] text-red-500 hover:text-red-600 font-bold bg-white hover:bg-red-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
          <div className="flex items-center space-x-1 text-slate-400 text-xs font-semibold bg-white border border-slate-200 px-2 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="capitalize">{provider}</span>
          </div>
        </div>
      </div>

      {/* Messages Console */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {fetchingHistory ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <Loader className="w-6 h-6 animate-spin mr-2" />
            <span className="text-xs font-medium">Retrieving logs...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <Bot className="w-12 h-12 text-brand-300 stroke-1 mb-3" />
            <p className="text-sm font-semibold text-slate-700">Discuss Your Report</p>
            <p className="text-xs text-slate-400 mt-1">
              Ask any health indicators questions. The AI will search specific PDF chunks for factual responses.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-500 text-white font-medium rounded-tr-none'
                    : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'
                }`}
              >
                {msg.message}
              </div>
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-500 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-500 flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin text-brand-500" />
              <span>Scanning context and typing response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && !fetchingHistory && (
        <div className="px-6 py-2 bg-slate-50/50 border-t border-slate-100 flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-brand-500 hover:text-brand-600 transition-colors flex items-center space-x-1"
            >
              <HelpCircle className="w-3 h-3 text-brand-500" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dynamic Regional Virtual Keyboard Drawer */}
      {showKeyboard && (() => {
        const layout = getKeyboardLayout();
        return (
          <div className="bg-slate-50 border-t border-slate-100 p-4 space-y-3 max-h-[200px] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">{layout.title}</span>
              <button 
                type="button" 
                onClick={() => setShowKeyboard(false)} 
                className="text-[10px] text-brand-500 font-bold hover:underline"
              >
                Close
              </button>
            </div>
            
            {/* Vowels */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase w-full mb-0.5">Vowels</span>
              {layout.vowels.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertCharacter(char)}
                  className="h-7 px-2.5 bg-white hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm active:scale-95 text-slate-700"
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Modifiers */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase w-full mb-0.5">Modifiers</span>
              {layout.modifiers.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertCharacter(char)}
                  className="h-7 px-2.5 bg-white hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95 text-brand-600"
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Consonants */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase w-full mb-0.5">Consonants</span>
              {layout.consonants.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => insertCharacter(char)}
                  className="h-7 px-2.5 bg-white hover:bg-brand-50 hover:text-brand-600 border border-slate-200 rounded-md text-xs font-semibold transition-all shadow-sm active:scale-95 text-slate-700"
                >
                  {char}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => insertCharacter(' ')}
                className="flex-1 h-7.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-xs font-bold text-slate-600 transition-all shadow-sm active:scale-95"
              >
                {layout.space}
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="px-3 h-7.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {layout.backspace}
              </button>
              <button
                type="button"
                onClick={() => setInput('')}
                className="px-3 h-7.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                {layout.clear}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Input console */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 border-t border-slate-100 flex items-center space-x-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholder()}
          disabled={loading || !reportId}
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition-all disabled:opacity-50"
        />

        {/* Keyboard Toggle Button */}
        <button
          type="button"
          onClick={() => setShowKeyboard(!showKeyboard)}
          disabled={!reportId}
          className={`p-3 rounded-xl border transition-all disabled:opacity-50 ${
            showKeyboard 
              ? 'bg-brand-50 border-brand-200 text-brand-500 shadow-inner' 
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
          title="Toggle Hindi Keyboard"
        >
          <Keyboard className="w-4.5 h-4.5" />
        </button>

        <button
          type="submit"
          disabled={loading || !input.trim() || !reportId}
          className="p-3 bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-md shadow-brand-100 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
