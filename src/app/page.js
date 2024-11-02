'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, FileText, Loader2 } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image'

const PdfChatApp = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatContainerRef = useRef(null);

  const API_BASE_URL = 'http://localhost:8000';
  
  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/documents`);
      setDocuments(data);
    } catch (error) {
      setError('Failed to fetch documents. Please try again.');
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      await fetchDocuments();
      setSelectedDocument(data.document_id);
    } catch (error) {
      setError('Failed to upload file. Please try again.');
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedDocument) return;

    const userMessage = {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/ask`, {
        document_id: selectedDocument,
        question: message,
      });
      
      const aiMessage = {
        type: 'ai',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setError('Failed to get response. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
            
      {/* Header */}
      <header className="md-grid flex justify-between items-center p-4 border-b border-slate-700 bg-slate-600">
        
        <div className="flex items-center space-x-2">
        <Image src="/logo.png" alt="AI Planet" width={104} height={50} />
          
          
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedDocument || ''}
            onChange={(e) => setSelectedDocument(Number(e.target.value))}
            className="p-2 bg-slate-700 border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="">Select a document</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>

          <label className="flex items-center px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors">
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg flex items-start space-x-2">
          <div className="flex-shrink-0 w-5 h-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className="flex items-start space-x-3 animate-fadeIn">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center
              ${msg.type === 'user' ? 'bg-violet-500' : 'bg-emerald-500'}`}
            >
              {msg.type === 'user' ? (
                'U'
              ) : (
                'AI'
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-medium
                  ${msg.type === 'user' ? 'text-violet-400' : 'text-emerald-400'}`}>
                  {msg.type === 'user' ? 'You' : 'AI Planet'}
                </p>
                <span className="text-xs text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 text-slate-200">{msg.content}</p>
              {msg.sources && (
                <div className="mt-2 space-y-2">
                  {msg.sources.map((source, sourceIdx) => (
                    <div key={sourceIdx} className="flex items-start space-x-2 text-sm text-slate-400 border-l-2 border-slate-700 pl-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Page {source.page}: {source.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-700 p-4 bg-slate-800">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Send a message..."
            className="flex-1 p-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400"
            disabled={!selectedDocument || isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!selectedDocument || isLoading}
            className="p-2 text-emerald-500 hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfChatApp;