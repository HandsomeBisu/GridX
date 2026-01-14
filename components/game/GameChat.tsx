import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { GameRoom, ChatMessage } from '../../types';
import { GameService } from '../../services/gameService';
import { Button } from '../ui/Button';

interface GameChatProps {
  roomId: string;
  currentUser: any;
  chatMessages: ChatMessage[];
}

export const GameChat: React.FC<GameChatProps> = ({ roomId, currentUser, chatMessages }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    try {
      await GameService.sendChatMessage(roomId, {
        uid: currentUser.uid,
        displayName: currentUser.displayName
      }, inputText.trim());
      setInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 border-t border-gold-900/50">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gold-900/30 bg-black/20 flex items-center gap-2">
        <MessageSquare size={12} className="text-gold-500" />
        <span className="text-[10px] font-bold text-gold-400 tracking-wider uppercase">LIVE CHAT</span>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar min-h-0"
      >
        {chatMessages && chatMessages.length > 0 ? (
          chatMessages.map((msg) => {
            const isSystem = msg.type === 'SYSTEM';
            const isMe = msg.senderId === currentUser?.uid;

            if (isSystem) {
              return (
                <div key={msg.id} className="text-[11px] text-gold-400 bg-gold-900/10 border-l-2 border-gold-500 pl-2 py-1 leading-relaxed animate-fade-in-up">
                  {msg.text}
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-1 mb-0.5">
                   {!isMe && <span className="text-[10px] text-gray-500 font-bold">{msg.senderName}</span>}
                </div>
                <div className={`
                  px-3 py-1.5 rounded text-xs max-w-[90%] break-words
                  ${isMe 
                    ? 'bg-gold-600/20 text-gold-100 border border-gold-600/30 rounded-tr-none' 
                    : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'}
                `}>
                  {msg.text}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-gray-600 text-xs italic">
            채팅 내역이 없습니다.
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-2 bg-black/60 border-t border-gold-900/30 flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지 입력..."
          className="flex-1 bg-gray-900/50 border border-gray-700 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold-500 transition-colors placeholder:text-gray-600"
          maxLength={100}
        />
        <Button 
            type="submit" 
            variant="ghost" 
            size="sm" 
            className="px-3 bg-gold-900/20 hover:bg-gold-500 hover:text-black border border-gold-900 text-gold-500"
            disabled={!inputText.trim()}
        >
            <Send size={14} />
        </Button>
      </form>
    </div>
  );
};
