import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-support-chat`;

const SupportChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! 👋 Soy Silvia, tu asistente virtual de Silverdata. ¿En qué puedo ayudarte hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ticketCreated, setTicketCreated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const WHATSAPP_LINK = "https://wa.me/+582128173500";

  const createTicketFromChat = async (ticketType: string, title: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Error", description: "Debes iniciar sesión para crear un ticket", variant: "destructive" });
        return false;
      }
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id, ticket_type: ticketType, title, description: `[Creado por Silvia] ${description}`, priority: 'medium', status: 'open'
      });
      if (error) throw error;
      setTicketCreated(true);
      toast({
        title: "✅ Ticket creado",
        description: (
          <div className="space-y-2">
            <p>Tu solicitud ha sido registrada. Un técnico te contactará pronto.</p>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-primary underline block">📱 Contactar por WhatsApp</a>
          </div>
        ),
      });
      return true;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({ title: "Error", description: "No se pudo crear el ticket. Intenta de nuevo.", variant: "destructive" });
      return false;
    }
  };

  const parseAndCreateTicket = async (content: string) => {
    const ticketMatch = content.match(/\[CREAR_TICKET:(\w+):([^:]+):([^\]]+)\]/);
    if (ticketMatch) {
      const [, type, title, description] = ticketMatch;
      const typeMap: Record<string, string> = { 'technical_support': 'technical', 'technical': 'technical', 'billing': 'billing', 'service_request': 'service', 'service': 'service' };
      await createTicketFromChat(typeMap[type] || 'technical', title, description);
      return content.replace(/\[CREAR_TICKET:[^\]]+\]/, '').trim();
    }
    return content;
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) inputRef.current.focus();
  }, [isOpen, isMinimized]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (isMobile && isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, isOpen, isMinimized]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      body: JSON.stringify({ messages: userMessages }),
    });
    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "Error al conectar con el asistente");
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && prev.length > 1) {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch { textBuffer = line + "\n" + textBuffer; break; }
      }
    }
    if (assistantContent.includes('[CREAR_TICKET:')) {
      const cleanedContent = await parseAndCreateTicket(assistantContent);
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === "assistant" ? { ...m, content: cleanedContent || "He creado un ticket de soporte para tu caso. Un técnico te contactará pronto. 📋" } : m));
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    try {
      await streamChat(newMessages.filter(m => m.content !== "¡Hola! 👋 Soy Silvia, tu asistente virtual de Silverdata. ¿En qué puedo ayudarte hoy?"));
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo o crea un ticket de soporte." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickActions = [
    { label: "📋 Planes", msg: "¿Cuáles son los planes?" },
    { label: "🐌 Internet lento", msg: "Mi internet está lento" },
    { label: "🔌 Sin conexión", msg: "No tengo conexión" },
    { label: "🔄 Cambiar plan", msg: "Cambiar mi plan" },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
      </button>
    );
  }

  // Full screen on mobile, floating card on desktop
  const containerClasses = isMobile
    ? `fixed inset-0 z-50 flex flex-col bg-card ${isMinimized ? 'h-14' : ''}`
    : `fixed bottom-6 right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 ${isMinimized ? 'w-80 h-14' : 'w-[380px] h-[520px]'} flex flex-col bg-card`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[hsl(220,50%,12%)] to-[hsl(220,40%,16%)] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[hsl(220,50%,12%)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Silvia</p>
            <p className="text-[10px] text-white/50">
              {isLoading ? 'Escribiendo...' : 'Asistente Silverdata'}
            </p>
          </div>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-1" />}
        </div>
        <div className="flex gap-1">
          {!isMobile && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary/50 text-foreground rounded-bl-md border border-border/30"
                  }`}>
                    {message.content}
                  </div>
                  {message.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Quick actions on initial state */}
              {messages.length === 1 && (
                <div className="pt-3 space-y-2">
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">Accesos rápidos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        className="text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-border/20 text-foreground transition-colors"
                        onClick={() => {
                          setInput(action.msg);
                          setTimeout(() => sendMessage(), 100);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border/30 bg-card/80 backdrop-blur-sm shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                className="flex-1 h-10 rounded-xl bg-secondary/30 border-border/30 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[9px] text-muted-foreground/50 text-center mt-1.5">Silvia puede cometer errores · Silverdata</p>
          </div>
        </>
      )}
    </div>
  );
};

export default SupportChatbot;
