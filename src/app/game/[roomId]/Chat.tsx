"use client";

import { useState, useEffect } from 'react';

interface ChatProps {
  roomId: string;
}

interface Message {
  id: number;
  text: string;
  sender: string;
}

export default function Chat({ roomId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // 웹소켓 로직 (예시)
  useEffect(() => {
    const accountId = `user_${Math.random().toString(36).substring(7)}`;
    const ws = new WebSocket(`ws://localhost:8000/ws/${roomId}/${accountId}`);

    ws.onmessage = (event) => {
      // 실제 애플리케이션에서는 메시지 형식을 파싱해야 합니다.
      const receivedMessage = event.data;
      setMessages(prev => [...prev, { id: Date.now(), text: receivedMessage, sender: 'Other' }]);
    };

    ws.onopen = () => console.log(`Chat WebSocket connected for room ${roomId}`);
    ws.onclose = () => console.log('Chat WebSocket disconnected');
    ws.onerror = (error) => console.error('Chat WebSocket error:', error);

    return () => {
      ws.close();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // 실제 웹소��을 통해 메시지를 보내는 로직이 필요합니다.
      setMessages(prev => [...prev, { id: Date.now(), text: newMessage, sender: 'Me' }]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-lg">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.sender === 'Me' ? 'text-right' : ''}`}>
            <span className={`px-3 py-1 rounded-lg text-black ${msg.sender === 'Me' ? 'bg-blue-500 text-black' : 'bg-gray-200'}`}>
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="w-full p-2 border rounded"
          placeholder="메시지를 입력하세요..."
        />
      </div>
    </div>
  );
}