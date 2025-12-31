import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Sparkles,
  Loader2,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

const AITutor = ({ question, userAnswer, correctAnswer, topic, isCorrect }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasExplanation, setHasExplanation] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getExplanation = async () => {
    setLoading(true);
    setIsOpen(true);

    try {
      const response = await fetch(`${API_URL}/api/ai-tutor/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": localStorage.getItem("userId") || "guest",
          username: localStorage.getItem("username") || "Guest",
        },
        body: JSON.stringify({
          question,
          userAnswer,
          correctAnswer,
          topic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get explanation");
      }

      const data = await response.json();
      setMessages([{ role: "ai", content: data.explanation }]);
      setHasExplanation(true);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const askFollowUp = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai-tutor/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": localStorage.getItem("userId") || "guest",
          username: localStorage.getItem("username") || "Guest",
        },
        body: JSON.stringify({
          messages: newMessages,
          context: { question, topic },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages([...newMessages, { role: "ai", content: data.response }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askFollowUp();
    }
  };

  return (
    <Card className="mt-3 sm:mt-4 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <CardHeader className="p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1 sm:gap-2 text-purple-700 text-sm sm:text-base">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            <span className="hidden xs:inline">AI Tutor</span>
            <span className="xs:hidden">Tutor</span>
            <Badge
              variant={isCorrect ? "default" : "destructive"}
              className="ml-1 sm:ml-2 text-xs"
            >
              {isCorrect ? "✓" : "✗"}
            </Badge>
          </CardTitle>
          {isOpen && (
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!isOpen ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Get a detailed explanation and ask follow-up questions about this
              topic!
            </p>
            <Button
              onClick={getExplanation}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Explanation...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Get Detailed Explanation
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Messages Area */}
            <ScrollArea className="h-[250px] sm:h-[350px] md:h-[400px] pr-2 sm:pr-4">
              <div className="space-y-3 sm:space-y-4">
                {messages.length === 0 && !loading && (
                  <div className="text-center text-gray-500 py-8">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                    <p>Click the button above to get an explanation!</p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white ml-auto"
                          : "bg-white border border-purple-200 shadow-sm"
                      }`}
                    >
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-700 text-sm">
                            AI Tutor
                          </span>
                        </div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        <span className="text-sm text-gray-600">
                          AI Tutor is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            {hasExplanation && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a follow-up question..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={askFollowUp}
                    disabled={loading || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  💡 Try asking: "Can you explain this differently?", "Give me
                  an example", or "What should I study next?"
                </p>
              </div>
            )}

            {/* Quick Questions */}
            {hasExplanation && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">
                  Quick questions:
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput("Can you give me a real-world example?");
                    }}
                    className="text-xs justify-start"
                  >
                    Give me an example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput(
                        "What are common mistakes people make with this?"
                      );
                    }}
                    className="text-xs"
                  >
                    Common mistakes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInput("How can I remember this better?");
                    }}
                    className="text-xs"
                  >
                    Memory tip
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              Minimize
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AITutor;
