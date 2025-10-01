import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from 'lucide-react';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [message, setMessage] = useState('');

  const mockChats = [
    {
      id: 1,
      name: 'Chef Maria',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b60b7f3d?w=100',
      lastMessage: 'Thanks for the recipe feedback!',
      time: '2m ago',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'Nutrition Group',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      lastMessage: 'New meal prep ideas shared',
      time: '1h ago',
      unread: 0,
      online: false,
      isGroup: true
    },
    {
      id: 3,
      name: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      lastMessage: 'How was the smoothie recipe?',
      time: '3h ago',
      unread: 1,
      online: true
    }
  ];

  const mockMessages = [
    {
      id: 1,
      sender: 'Chef Maria',
      text: 'Hi! I saw you tried my Mediterranean Bowl recipe. How did it turn out?',
      time: '10:30 AM',
      isOwn: false
    },
    {
      id: 2,
      sender: 'You',
      text: 'It was absolutely delicious! The flavors were amazing. Thank you for sharing!',
      time: '10:32 AM',
      isOwn: true,
      status: 'read'
    },
    {
      id: 3,
      sender: 'Chef Maria',
      text: 'I\'m so glad you enjoyed it! Did you make any modifications to suit your taste?',
      time: '10:35 AM',
      isOwn: false
    },
    {
      id: 4,
      sender: 'You',
      text: 'I added some extra feta cheese and a bit more lemon juice. Perfect combo!',
      time: '10:37 AM',
      isOwn: true,
      status: 'read'
    },
    {
      id: 5,
      sender: 'Chef Maria',
      text: 'Thanks for the recipe feedback!',
      time: '10:40 AM',
      isOwn: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 h-[80vh] flex overflow-hidden">
          {/* Chat List Sidebar */}
          <div className="w-1/3 border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {mockChats.map((chat) => (
                <motion.div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-all duration-200 hover:bg-white/10 ${
                    selectedChat === chat.id ? 'bg-emerald-500/20 border-r-2 border-r-emerald-500' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium truncate">{chat.name}</h3>
                        <span className="text-xs text-gray-400">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-sm truncate">{chat.lastMessage}</p>
                        {chat.unread > 0 && (
                          <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={mockChats.find(c => c.id === selectedChat)?.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-white font-semibold">
                    {mockChats.find(c => c.id === selectedChat)?.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {mockChats.find(c => c.id === selectedChat)?.online ? 'Active now' : 'Last seen 3h ago'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-5 h-5 text-gray-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Video className="w-5 h-5 text-gray-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {mockMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.isOwn 
                      ? 'bg-emerald-500 text-white rounded-br-md' 
                      : 'bg-white/10 text-white rounded-bl-md'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs opacity-70">{msg.time}</span>
                      {msg.isOwn && (
                        <CheckCheck className="w-3 h-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </motion.button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Smile className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
