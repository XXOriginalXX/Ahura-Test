import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, TrendingUp, Camera, X, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Define the props interface for the component
interface FinanceChatbotProps {
  stockData: any[];
  candleData: any[];
  selectedStock: string;
  timeframe: string;
  chartType: 'line' | 'candlestick';
}

const FinanceChatbot: React.FC<FinanceChatbotProps> = ({ 
  stockData, 
  candleData, 
  selectedStock, 
  timeframe, 
  chartType 
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [apiKey, setApiKey] = useState("AIzaSyDYraZrXVcJMxs2_83m4ueFrvl9cL_QI0s"); // Pre-set API key
  const messagesEndRef = useRef(null);
  const screenshotImageRef = useRef<string | null>(null);
  
  // Updated API Configuration for Gemini 2.0
  const GEMINI_MODEL = "gemini-2.0-flash"; // Using the flash model for faster responses
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      { 
        type: 'bot', 
        content: "Hello! I'm your Indian Stock Market Assistant powered by vector research. How can I help you today?",
        isInfo: false
      },
      {
        type: 'bot',
        content: "I can analyze the current stock chart and provide information on whether you should buy or sell, at what price, and any patterns I detect.",
        isDisclaimer: true
      },
      {
        type: 'bot',
        content: "Simply ask me to 'analyze this chart' or 'should I buy or sell?'",
        isInfo: true
      }
    ]);
  }, []);
  
  // Update messages when stock changes to notify the user
  useEffect(() => {
    if (messages.length > 3) { // Only do this after initial messages
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `Stock changed to ${selectedStock}. Ask me to analyze this chart for updated information.`,
        isInfo: true
      }]);
    }
  }, [selectedStock]);

  // Function to handle API errors consistently
  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        return "API access denied. Your API key may be invalid or has reached its quota limit. Try updating your API key with '/apikey YOUR_NEW_KEY'";
      } else if (status === 429) {
        return "Too many requests to the API. Please wait a moment before trying again.";
      } else if (status === 404 || status === 400) {
        return "API endpoint not found or bad request. The Gemini API services may have changed. Check if you're using the correct endpoints.";
      }
    } else if (error.message && error.message.includes('Network Error')) {
      return "Network connection error. Please check your internet connection.";
    }
    
    return `Error: ${error.message || "Unknown error"}. Please try again or update your API key with '/apikey YOUR_NEW_KEY'`;
  };

  // Convert current chart data to text for analysis
  const getCurrentChartDataAsText = () => {
    if (!stockData || stockData.length === 0) {
      return "No chart data available for analysis.";
    }
    
    const data = chartType === 'line' ? stockData : candleData;
    const firstPrice = data[0]?.price || data[0]?.close || 0;
    const lastPrice = data[data.length - 1]?.price || data[data.length - 1]?.close || 0;
    const change = lastPrice - firstPrice;
    const percentChange = ((change / firstPrice) * 100).toFixed(2);
    const isPositive = change >= 0;
    
    let points = [];
    // Take at most 20 data points for analysis to avoid overloading
    const step = Math.max(1, Math.floor(data.length / 20));
    for (let i = 0; i < data.length; i += step) {
      if (points.length >= 20) break;
      
      const item = data[i];
      if (chartType === 'line') {
        points.push(`${item.date}: ${item.price}`);
      } else {
        points.push(`${item.date}: Open=${item.open}, Close=${item.close}, High=${item.high}, Low=${item.low}`);
      }
    }
    
    return `
Current Stock: ${selectedStock.replace('.NS', '')}
Timeframe: ${timeframe}
Chart Type: ${chartType}
Current Price: ${lastPrice}
Change: ${change > 0 ? '+' : ''}${change.toFixed(2)} (${isPositive ? '+' : ''}${percentChange}%)
Trend Direction: ${isPositive ? 'Upward' : 'Downward'}

Sample Data Points:
${points.join('\n')}
`;
  };

  // Function to analyze current stock chart
  const analyzeCurrentChart = async () => {
    setLoading(true);
    
    try {
      const chartData = getCurrentChartDataAsText();
      
      const requestData = {
        contents: [
          {
            parts: [
              { 
                text: `You are a professional Indian stock market analyst. Analyze the following stock data in detail and provide:
                
1) Should one buy or sell this stock right now based on technical patterns? Be direct with your recommendation.
2) If recommending to buy, suggest an ideal price point. If recommending to sell, suggest a target to exit.
3) Identify specific chart patterns present (e.g., head and shoulders, double top, support/resistance levels)
4) Key resistance levels (price points)
5) Key support levels (price points)

Your analysis must be focused EXCLUSIVELY on the provided data. Do not make general statements about market sectors or talk about fundamentals.


Data to analyze:
${chartData}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 350,
          temperature: 0.2
        }
      };
      
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        throw new Error("Empty response from API");
      }
      
      const candidate = response.data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("Invalid response format from API");
      }
      
      const responseText = candidate.content.parts[0].text;
      
      // Parse the response into structured data
      const extractSection = (section: string) => {
        const regex = new RegExp(`${section}:\\s*(.*?)(?=\\n\\w+:|$)`, 'is');
        const match = responseText.match(regex);
        return match ? match[1].trim() : `${section} information not available`;
      };
      
      const analysisResult = {
        recommendation: extractSection('RECOMMENDATION'),
        targetPrice: extractSection('TARGET PRICE'),
        patterns: extractSection('PATTERNS'),
        support: extractSection('SUPPORT'),
        resistance: extractSection('RESISTANCE'),
        disclaimer: "This analysis is for educational purposes only and not financial advice. Past patterns don't guarantee future results."
      };
      
      // Send analysis to the user
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: analysisResult,
        hasScreenshot: false
      }]);
      
    } catch (error) {
      console.error("Analysis API error:", error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: handleApiError(error),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Improved screen capture function
  const captureScreen = async () => {
    setCapturing(true);
    setMessages(prev => [...prev, { 
      type: 'bot', 
      content: "Please select the screen with your chart to analyze. I'll provide insights about buy/sell decisions and patterns.",
      isPrompt: true
    }]);
    
    try {
      // Request screen capture permission with corrected constraints
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false
      });
      
      // Create video element to display the screen capture
      const video = document.createElement("video");
      video.srcObject = stream;
      
      // Wait for video metadata to load with proper type handling
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      // Create canvas to capture frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get the image data
      const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      
      // Store reference to image (for display)
      screenshotImageRef.current = imageUrl;
      
      // Add capture confirmation message
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: "I've captured your screen. Instead, let me analyze the current chart data directly for more accurate results.",
        isInfo: true
      }]);
      
      // Process the current chart data instead of the image
      analyzeCurrentChart();
      
    } catch (captureError: any) {
      console.error("Screen capture error:", captureError);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: captureError.message || "Screen capture was canceled or failed. Let me analyze the current chart data instead.",
        isInfo: true
      }]);
      
      // Fall back to analyzing current chart data
      analyzeCurrentChart();
    } finally {
      setCapturing(false);
    }
  };

  // Updated test connection function to use the correct endpoint
  const testConnection = async () => {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: "Respond with 'API Connection Successful' if you receive this message."
            }]
          }],
          generationConfig: {
            maxOutputTokens: 20
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data && response.data.candidates && response.data.candidates.length > 0;
    } catch (error) {
      console.error("API test error:", error);
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || capturing) return;

    // Add user message
    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const userInput = input.trim();
    setInput('');
    
    // Handle API key update command
    if (userInput.toLowerCase().startsWith("/apikey ")) {
      const newApiKey = userInput.substring(8).trim();
      if (newApiKey) {
        setApiKey(newApiKey);
        localStorage.setItem('geminiApiKey', newApiKey);
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: "API key updated successfully!",
          isInfo: true
        }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: "Please provide a valid API key after the /apikey command.",
          isError: true
        }]);
      }
      return;
    }
    
    // Check if the message is asking for chart analysis
    const analysisKeywords = [
      "analyze", "analyse", "chart", "graph", "buy", "sell", 
      "should i buy", "should i sell", "pattern", "recommend",
      "what do you think", "what's your opinion"
    ];
    
    const isAnalysisRequest = analysisKeywords.some(
      keyword => userInput.toLowerCase().includes(keyword)
    );
    
    if (isAnalysisRequest || userInput.toLowerCase() === "analyze this chart") {
      // Instead of screen capture, directly analyze current chart data
      analyzeCurrentChart();
      return;
    }
    
    // Handle screen capture request
    const screenAnalysisKeywords = [
      "screen", "capture", "screenshot", "look at my screen", 
      "what do you see", "what's on my screen"
    ];
    
    const isScreenCaptureRequest = screenAnalysisKeywords.some(
      keyword => userInput.toLowerCase().includes(keyword)
    );
    
    if (isScreenCaptureRequest) {
      captureScreen();
      return;
    }
    
    // Handle help command
    if (userInput.toLowerCase() === 'help' || userInput.toLowerCase() === '/help') {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: `Here are some commands you can use:
        
1. Ask for chart analysis: "Analyze this chart" or "Should I buy or sell?"
2. Get specific pattern detection: "What patterns do you see?"
3. Ask about support/resistance: "What are the support and resistance levels?"
4. Update API key: "/apikey YOUR_NEW_API_KEY"
5. Get help: "/help" or "help"
6. Test connection: "/test" or "test connection"

I'll provide information specifically about the stock chart you're currently viewing.`,
        isInfo: true
      }]);
      return;
    }
    
    // Handle system test command
    if (userInput.toLowerCase() === '/test' || userInput.toLowerCase() === 'test connection') {
      setLoading(true);
      try {
        const isConnected = await testConnection();
        if (isConnected) {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: "API Connection Successful!",
            isInfo: true
          }]);
        } else {
          setMessages(prev => [...prev, { 
            type: 'bot', 
            content: "API Connection Failed. Please check your API key and try again.",
            isError: true
          }]);
        }
      } catch (error) {
        console.error("API test error:", error);
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: handleApiError(error),
          isError: true
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // For any other queries, analyze the current chart
    setLoading(true);
    
    try {
      // Default to chart analysis for any stock-related queries
      analyzeCurrentChart();
    } catch (error) {
      console.error("API Call Error:", error);
      
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: handleApiError(error),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Render formatted analysis content
  const renderAnalysisContent = (content: any) => {
    if (typeof content === 'string') {
      return content;
    }
    
    return (
      <div className="space-y-3">
        <div className="font-medium flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Analysis for {selectedStock.replace('.NS', '')}:</span>
        </div>
        
        <div className="font-medium mt-2">
          <span>Recommendation:</span>
        </div>
        <p className="text-sm">{content.recommendation}</p>
        
        <div className="font-medium mt-2">
          <span>Target Price:</span>
        </div>
        <p className="text-sm">{content.targetPrice}</p>
        
        {content.patterns && (
          <>
            <div className="font-medium mt-2">
              <span>Pattern Identification:</span>
            </div>
            <p className="text-sm">{content.patterns}</p>
          </>
        )}
        
        <div className="text-sm">
          <div className="font-medium mt-2">Key Levels:</div>
          <div><strong>Support:</strong> {content.support}</div>
          <div><strong>Resistance:</strong> {content.resistance}</div>
        </div>
        
        {content.disclaimer && (
          <div className="text-xs text-yellow-600 mt-2 border-t pt-2 border-yellow-200">
            {content.disclaimer}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Chat button */}
      <motion.button
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200"
          >
            {/* Chatbot Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Stock Analysis Assistant</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className={`flex ${message.type === 'user' ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === 'user' 
                      ? "bg-blue-500 text-white" 
                      : message.isDisclaimer || message.isPrompt
                        ? "bg-yellow-50 border border-yellow-200 text-gray-800" 
                        : message.isError
                          ? "bg-red-50 border border-red-200 text-gray-800"
                          : message.isInfo
                            ? "bg-blue-50 border border-blue-200 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                    } ${message.isDisclaimer || message.isPrompt || message.isError || message.isInfo ? "flex items-start gap-2" : ""}`}
                  >
                    {message.isDisclaimer && <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-500" />}
                    {message.isPrompt && <Camera className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" />}
                    {message.isError && <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />}
                    {message.isInfo && <Info className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" />}
                    
                    <div>
                      {typeof message.content === 'object' 
                        ? renderAnalysisContent(message.content) 
                        : typeof message.content === 'string'
                          ? <div dangerouslySetInnerHTML={{ 
                              __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') 
                            }} />
                          : message.content}
                      
                      {message.hasScreenshot && screenshotImageRef.current && (
                        <div className="mt-2">
                          <img 
                            src={screenshotImageRef.current} 
                            alt="Chart Screenshot" 
                            className="w-full h-auto rounded-md border border-gray-200 mt-1" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* Loading indicator */}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 text-gray-800 p-3 rounded-lg flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                  </div>
                </motion.div>
              )}
              
              {/* Capturing indicator */}
              {capturing && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex justify-start"
                >
                  <div className="bg-blue-50 border border-blue-200 text-gray-800 p-3 rounded-lg flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-blue-500 animate-pulse" />
                    <span>Capturing your screen...</span>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Disclaimer */}
            <div className="p-2 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 flex items-start gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-500" />
                <span>Analysis is for educational purposes only. Not financial advice.</span>
              </div>
            </div>
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder="Ask 'Should I buy this stock?' or 'Analyze chart'" 
                  disabled={loading || capturing} 
                  className="flex-1 bg-gray-100 text-gray-800 rounded-lg px-4 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  type="submit" 
                  disabled={loading || capturing || !input.trim()} 
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinanceChatbot;
