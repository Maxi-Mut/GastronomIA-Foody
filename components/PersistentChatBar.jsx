'use client';

import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

export default function PersistentChatBar({ onSendMessage, isPending }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="sticky bottom-20 md:bottom-4 left-0 right-0 z-20 flex justify-center px-3 sm:px-4 pointer-events-none transition-all">
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto w-full max-w-2xl bg-white/95 dark:bg-[#1B211D]/95 rounded-full shadow-float border border-[#E8E6DF] dark:border-neutral-700 p-1 sm:p-1.5 pl-4 sm:pl-5 flex items-center space-x-2 sm:space-x-3 backdrop-blur-md"
      >
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37] shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Preguntale a Foody... (ej: 'bodegón en San Telmo sin TACC')"
          className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none min-w-0"
        />
        <button
          type="submit"
          disabled={!input.trim() || isPending}
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#133829] hover:bg-[#1a4a37] text-white flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
          title="Enviar consulta a Foody"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
