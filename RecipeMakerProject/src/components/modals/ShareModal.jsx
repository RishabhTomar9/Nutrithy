import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaTwitter, FaFacebook, FaLink, FaWhatsapp, FaEnvelope } from 'react-icons/fa';

const ShareModal = ({ post, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  
  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  const modalVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 500 } }
  };
  
  // Generate a shareable URL for the post
  const getShareableUrl = () => {
    // In a real app, this would be a proper URL to the specific post
    return `${window.location.origin}/community/post/${post.id}`;
  };
  
  // Handle copy link to clipboard
  const handleCopyLink = () => {
    const url = getShareableUrl();
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Handle social media sharing
  const handleShare = (platform) => {
    const url = getShareableUrl();
    const text = `Check out this post by ${post.author}: ${post.content.substring(0, 50)}...`;
    let shareUrl;
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out this post')}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      default:
        return;
    }
    
    // Open share dialog in a new window
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShareStatus(`Shared to ${platform}!`);
    setTimeout(() => setShareStatus(''), 2000);
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div 
        className="bg-gray-800/90 border border-gray-700 rounded-xl w-full max-w-md overflow-hidden shadow-xl"
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Share Post</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        
        {/* Post Preview */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
              {post.author.charAt(0)}
            </div>
            <div>
              <h4 className="font-medium text-white">{post.author}</h4>
              <p className="text-xs text-gray-400">{post.timestamp}</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm line-clamp-2">{post.content}</p>
        </div>
        
        {/* Share Options */}
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <button 
              onClick={() => handleShare('twitter')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition-colors">
                <FaTwitter size={20} />
              </div>
              <span className="text-xs text-gray-300">Twitter</span>
            </button>
            
            <button 
              onClick={() => handleShare('facebook')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-[#4267B2]/10 flex items-center justify-center text-[#4267B2] hover:bg-[#4267B2]/20 transition-colors">
                <FaFacebook size={20} />
              </div>
              <span className="text-xs text-gray-300">Facebook</span>
            </button>
            
            <button 
              onClick={() => handleShare('whatsapp')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                <FaWhatsapp size={20} />
              </div>
              <span className="text-xs text-gray-300">WhatsApp</span>
            </button>
            
            <button 
              onClick={() => handleShare('email')}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-600/10 flex items-center justify-center text-gray-400 hover:bg-gray-600/20 transition-colors">
                <FaEnvelope size={20} />
              </div>
              <span className="text-xs text-gray-300">Email</span>
            </button>
          </div>
          
          {/* Copy Link */}
          <div className="flex items-center gap-2 bg-gray-700/30 rounded-lg p-2">
            <div className="flex-1 truncate text-sm text-gray-300">
              {getShareableUrl()}
            </div>
            <button 
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'}`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          {/* Share Status */}
          {shareStatus && (
            <div className="mt-3 text-center text-sm text-green-400">
              {shareStatus}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ShareModal;