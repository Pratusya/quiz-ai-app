// src/components/Contact.jsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Mail,
  MessageSquare,
  User,
  Send,
  MapPin,
  Clock,
  Sparkles,
  Headphones,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        toast.error(data.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Us",
      value: "pratsuyaharsora@gmail.com",
      description: "We reply within 24 hours",
    },
    {
      icon: <Headphones className="w-5 h-5" />,
      title: "Support",
      value: "24/7 Available",
      description: "Chat support online",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Location",
      value: "Gujarat, India",
      description: "Asia Pacific",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Response Time",
      value: "< 24 Hours",
      description: "Average response",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">Contact Us</span>
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions or feedback? We'd love to hear from you. Send us a
          message and we'll respond as soon as possible.
        </p>
      </motion.div>

      {/* Contact Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14"
      >
        {contactInfo.map((info, index) => (
          <div
            key={index}
            className="glass-card rounded-xl p-4 sm:p-5 text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
              {info.icon}
            </div>
            <h3 className="text-sm sm:text-base font-semibold mb-1">
              {info.title}
            </h3>
            <p className="text-xs sm:text-sm text-primary font-medium">
              {info.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
              {info.description}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Contact Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Send us a Message
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Fill out the form below and we'll get back to you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <User className="w-4 h-4" />
                    Your Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter full name"
                    className="h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Mail className="w-4 h-4" />
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="h-10 sm:h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="message"
                  className="flex items-center gap-2 text-sm sm:text-base"
                >
                  <MessageSquare className="w-4 h-4" />
                  Your Message
                </Label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows="4"
                  placeholder="How can we help you?"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 sm:h-12 text-base"
                variant="gradient"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 sm:mt-8"
        >
          <p className="text-sm sm:text-base text-muted-foreground">
            Looking for quick answers?{" "}
            <a href="#" className="text-primary hover:underline font-medium">
              Check our FAQ
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Contact;
