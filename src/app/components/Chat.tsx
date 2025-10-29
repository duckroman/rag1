'use client';
import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Paper, Typography, Avatar, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesSentCount, setMessagesSentCount] = useState(0);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setMessagesSentCount(prev => prev + 1); // Increment message count

    setMessages(prev => [...prev, { role: 'bot', content: '' }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ details: 'Failed to get a valid error response from server.' }));
        throw new Error(errorData.details || 'Failed to get response from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content += chunk;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Message History */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>Chat</Typography>
          <Typography variant="caption" color="text.disabled">Mensajes enviados: {messagesSentCount}</Typography>
        </Box>
        {messages.map((msg, index) => (
          <Box key={index} sx={{ display: 'flex', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 1, maxWidth: '80%' }}>
            {msg.role === 'bot' && <Avatar><SmartToyIcon /></Avatar>}
            <Paper elevation={2} sx={{ p: 1.5, bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper', color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary' }}>
              <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</Typography>
            </Paper>
            {msg.role === 'user' && <Avatar><PersonIcon /></Avatar>}
          </Box>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== 'user' && (
            <Box sx={{ display: 'flex', alignSelf: 'flex-start', gap: 1}}>
                <Avatar><SmartToyIcon /></Avatar>
                <Paper elevation={2} sx={{ p: 1.5, bgcolor: 'background.paper'}}><CircularProgress size={20} /></Paper>
            </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box component="form" onSubmit={handleSubmit} sx={{ p: 1, display: 'flex', alignItems: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField fullWidth variant="outlined" size="small" placeholder="Escribe una pregunta..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
        <IconButton color="primary" type="submit" aria-label="send message" disabled={isLoading || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}