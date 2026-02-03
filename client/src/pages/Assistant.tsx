import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Bot } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Assistant() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "Ciao! Sono il tuo assistente per la gestione della cucina. Posso aiutarti a ottimizzare le ricette, suggerire sostituzioni di ingredienti per ridurre i costi, e rispondere a domande sulla struttura gerarchica delle tue ricette. Come posso aiutarti?" }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, { role: "user", content: message }]);
    setMessage("");
    toast.info("Funzionalità assistente AI in arrivo");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assistente AI</h1>
          <p className="text-slate-600 mt-1">Ottimizzazione ricette e suggerimenti</p>
        </div>
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-emerald-600" />
              Chat Assistente
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Scrivi un messaggio..." 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button onClick={handleSend} className="bg-emerald-600 hover:bg-emerald-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
