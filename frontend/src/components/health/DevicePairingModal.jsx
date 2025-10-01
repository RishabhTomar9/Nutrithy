import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  X, Smartphone, Watch, Activity, Heart, Footprints, 
  Zap, CheckCircle, AlertCircle, Loader2, RefreshCw,
  Bluetooth, Wifi, Shield, Clock, ChevronLeft, ChevronRight,
  Signal, Battery, Vibrate, Info, Settings, Star,
  ArrowRight, Check, ExternalLink, Download, Zap as Lightning
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import healthDataService from '../../services/healthDataService';
import '../../styles/modal-utils.css';

const DevicePairingModal = memo(({ isVisible, onClose, onSuccess }) => {
  const { user } = useAuth();
  const modalRef = useRef(null);
  
  // Accessibility and performance
  const shouldReduceMotion = useReducedMotion();
  
  // Enhanced state management
  const [activeTab, setActiveTab] = useState('googlefit');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState({
    googleFit: false,
    smartwatch: false
  });
  const [smartwatchDevices, setSmartwatchDevices] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentStep, setCurrentStep] = useState('overview');
  const [deviceSearching, setDeviceSearching] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [signalStrength, setSignalStrength] = useState(null);
  
  // Enhanced responsive detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsFullScreen(width < 640 || height < 700);
      
      // Set screen size for better layout decisions
      if (width < 480) {
        setScreenSize('xs');
      } else if (width < 768) {
        setScreenSize('sm');
      } else if (width < 1024) {
        setScreenSize('md');
      } else if (width < 1440) {
        setScreenSize('lg');
      } else {
        setScreenSize('xl');
      }
    };
    
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);

  // Touch gesture handling
  useEffect(() => {
    if (!isVisible || !isMobile) return;
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        modalRef.current?.style.setProperty('--initial-y', touch.clientY);
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && modalRef.current) {
        const touch = e.touches[0];
        const initialY = parseFloat(modalRef.current.style.getPropertyValue('--initial-y') || 0);
        const deltaY = touch.clientY - initialY;
        
        if (deltaY > 50) {
          modalRef.current.style.transform = `translateY(${Math.min(deltaY - 50, 100)}px)`;
          modalRef.current.style.opacity = Math.max(1 - (deltaY - 50) / 200, 0.7);
        }
      }
    };
    
    const handleTouchEnd = (e) => {
      if (modalRef.current) {
        const transform = modalRef.current.style.transform;
        const translateY = parseInt(transform.match(/translateY\((.+)px\)/)?.[1] || 0);
        
        if (translateY > 50) {
          onClose();
        } else {
          modalRef.current.style.transform = '';
          modalRef.current.style.opacity = '';
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isVisible, isMobile, onClose]);

  useEffect(() => {
    if (isVisible && user) {
      checkConnectionStatus();
      setCurrentStep('overview');
    }
  }, [isVisible, user]);
  
  // Prevent body scroll on mobile when modal is open and add keyboard navigation
  useEffect(() => {
    if (isVisible) {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      
      // Add keyboard navigation
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
        if (e.key === 'Tab') {
          // Let the browser handle tab navigation within the modal
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements?.length) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isVisible, isMobile, onClose]);

  const checkConnectionStatus = async () => {
    try {
      const status = await healthDataService.getConnectionStatus(user.uid);
      setConnectionStatus({
        googleFit: status?.googleFitConnected || false,
        smartwatch: status?.smartwatchConnected || false
      });
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  };

  const handleGoogleFitConnect = async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const result = await healthDataService.connectGoogleFit();
      if (result.pending) {
        // User will be redirected, close the modal
        onClose();
      } else if (result.success) {
        setConnectionStatus(prev => ({ ...prev, googleFit: true }));
        onSuccess?.('googlefit');
      }
    } catch (error) {
      console.error('Google Fit connection error:', error);
      setConnectionError(
        error.message.includes('cancelled')
          ? 'Connection was cancelled. Please try again.'
          : 'Failed to connect to Google Fit. Please check your browser settings and try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGoogleFitDisconnect = async () => {
    setIsConnecting(true);
    try {
      await healthDataService.disconnectGoogleFit();
      setConnectionStatus(prev => ({ ...prev, googleFit: false }));
    } catch (error) {
      console.error('Error disconnecting Google Fit:', error);
      setConnectionError('Failed to disconnect Google Fit.');
    } finally {
      setIsConnecting(false);
    }
  };

  const scanForDevices = async () => {
    setDeviceSearching(true);
    setNearbyDevices([]);
    
    // Simulate device scanning with mock devices for demo
    const mockDevices = [
      { name: 'Apple Watch Series 9', type: 'apple', rssi: -45, battery: 85 },
      { name: 'Samsung Galaxy Watch6', type: 'samsung', rssi: -52, battery: 72 },
      { name: 'Fitbit Sense 2', type: 'fitbit', rssi: -38, battery: 91 },
      { name: 'Garmin Venu 3', type: 'garmin', rssi: -60, battery: 68 }
    ];
    
    for (let i = 0; i < mockDevices.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setNearbyDevices(prev => [...prev, mockDevices[i]]);
    }
    
    setDeviceSearching(false);
  };

  const handleSmartwatchConnect = async (selectedDevice = null) => {
    setIsConnecting(true);
    setConnectionError('');
    setSmartwatchDevices([]);
    
    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser');
      }

      // Enhanced device filtering with more brands and services
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['fitness_machine'] },
          { services: ['battery_service'] },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Samsung' },
          { namePrefix: 'Apple' },
          { namePrefix: 'Polar' },
          { namePrefix: 'Suunto' },
          { namePrefix: 'Amazfit' },
          { namePrefix: 'Huawei' },
          { namePrefix: 'Xiaomi' }
        ],
        optionalServices: [
          'battery_service', 
          'device_information',
          'heart_rate',
          'fitness_machine',
          'running_speed_and_cadence',
          'cycling_speed_and_cadence'
        ]
      });

      setCurrentStep('connecting');
      const server = await device.gatt.connect();
      
      // Get battery level if available
      try {
        const batteryService = await server.getPrimaryService('battery_service');
        const batteryCharacteristic = await batteryService.getCharacteristic('battery_level');
        const batteryValue = await batteryCharacteristic.readValue();
        setBatteryLevel(batteryValue.getUint8(0));
      } catch (e) {
        console.log('Battery service not available');
      }
      
      // Simulate signal strength
      setSignalStrength(Math.floor(Math.random() * 30) + 70);
      
      // Save connection status
      await healthDataService.saveConnectionStatus(user.uid, {
        smartwatchConnected: true,
        smartwatchName: device.name,
        smartwatchId: device.id,
        batteryLevel: batteryLevel,
        signalStrength: signalStrength,
        connectedAt: new Date()
      });

      setConnectionStatus(prev => ({ ...prev, smartwatch: true }));
      setSmartwatchDevices([{
        name: device.name,
        id: device.id,
        connected: true,
        battery: batteryLevel,
        signal: signalStrength
      }]);
      
      setCurrentStep('success');
      setTimeout(() => {
        onSuccess?.('smartwatch');
        setCurrentStep('overview');
      }, 2000);
    } catch (error) {
      console.error('Smartwatch connection error:', error);
      setCurrentStep('overview');
      setConnectionError(
        error.name === 'NotFoundError' 
          ? 'Device selection was cancelled.'
          : error.name === 'NotSupportedError'
          ? 'This device is not supported. Try a different smartwatch.'
          : 'Failed to connect to smartwatch. Make sure Bluetooth is enabled and the device is in pairing mode.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSmartwatchDisconnect = async () => {
    setIsConnecting(true);
    try {
      await healthDataService.saveConnectionStatus(user.uid, {
        smartwatchConnected: false,
        disconnectedAt: new Date()
      });
      setConnectionStatus(prev => ({ ...prev, smartwatch: false }));
      setSmartwatchDevices([]);
    } catch (error) {
      console.error('Error disconnecting smartwatch:', error);
      setConnectionError('Failed to disconnect smartwatch.');
    } finally {
      setIsConnecting(false);
    }
  };

  const deviceFeatures = {
    googlefit: [
      { 
        icon: Footprints, 
        label: 'Steps & Distance', 
        description: 'Track daily steps and distance walked',
        value: '10,247 steps',
        color: 'text-blue-400'
      },
      { 
        icon: Heart, 
        label: 'Heart Rate', 
        description: 'Monitor heart rate throughout the day',
        value: 'Avg 72 bpm',
        color: 'text-red-400'
      },
      { 
        icon: Zap, 
        label: 'Calories', 
        description: 'Track calories burned from activities',
        value: '2,340 kcal',
        color: 'text-orange-400'
      },
      { 
        icon: Clock, 
        label: 'Sleep Tracking', 
        description: 'Monitor sleep duration and quality',
        value: '7h 42m',
        color: 'text-purple-400'
      }
    ],
    smartwatch: [
      { 
        icon: Heart, 
        label: 'Real-time Heart Rate', 
        description: 'Live heart rate monitoring with alerts',
        value: 'Live monitoring',
        color: 'text-red-400'
      },
      { 
        icon: Activity, 
        label: 'Workout Tracking', 
        description: 'Track specific workouts and exercises',
        value: '40+ activities',
        color: 'text-green-400'
      },
      { 
        icon: Bluetooth, 
        label: 'Instant Sync', 
        description: 'Real-time data synchronization',
        value: 'Auto sync',
        color: 'text-blue-400'
      },
      { 
        icon: Shield, 
        label: 'Secure Connection', 
        description: 'Encrypted device communication',
        value: 'End-to-end',
        color: 'text-indigo-400'
      }
    ]
  };
  
  const supportedDevices = {
    smartwatch: [
      { brand: 'Apple', models: ['Watch Series 9', 'Watch Ultra 2', 'Watch SE'], icon: '🍎' },
      { brand: 'Samsung', models: ['Galaxy Watch6', 'Galaxy Watch6 Classic'], icon: '📱' },
      { brand: 'Fitbit', models: ['Sense 2', 'Versa 4', 'Charge 6'], icon: '⌚' },
      { brand: 'Garmin', models: ['Venu 3', 'Forerunner 965', 'Fenix 7'], icon: '🏃' },
      { brand: 'Polar', models: ['Vantage V3', 'Grit X2 Pro'], icon: '❄️' },
      { brand: 'Suunto', models: ['9 Peak Pro', 'Vertical'], icon: '🏔️' }
    ]
  };
  
  // Steps for connection process
  const connectionSteps = {
    googlefit: [
      { id: 'overview', title: 'Overview', icon: Info },
      { id: 'permissions', title: 'Permissions', icon: Shield },
      { id: 'connecting', title: 'Connecting', icon: Loader2 },
      { id: 'success', title: 'Success', icon: CheckCircle }
    ],
    smartwatch: [
      { id: 'overview', title: 'Overview', icon: Info },
      { id: 'scan', title: 'Scan Devices', icon: Bluetooth },
      { id: 'connecting', title: 'Connecting', icon: Loader2 },
      { id: 'success', title: 'Success', icon: CheckCircle }
    ]
  };

  if (!isVisible) return null;

  const ResponsiveHeader = () => {
    const getHeaderSize = () => {
      switch(screenSize) {
        case 'xs': return { icon: 18, title: 'text-base', subtitle: 'text-xs' };
        case 'sm': return { icon: 20, title: 'text-lg', subtitle: 'text-xs' };
        case 'md': return { icon: 22, title: 'text-xl', subtitle: 'text-sm' };
        case 'lg': return { icon: 24, title: 'text-2xl', subtitle: 'text-sm' };
        default: return { icon: 28, title: 'text-3xl', subtitle: 'text-base' };
      }
    };
    
    const sizes = getHeaderSize();
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isMobile ? 'sticky top-0 bg-gray-900/95 backdrop-blur-2xl z-20 -mx-4 -mt-4 px-4 pt-4 pb-3 mb-4 border-b border-gray-700/30' : 'mb-6'}`}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <motion.div 
              className={`${screenSize === 'xs' ? 'w-10 h-10' : screenSize === 'sm' ? 'w-11 h-11' : 'w-12 h-12'} rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-blue-500/20 flex items-center justify-center flex-shrink-0`}
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Activity size={sizes.icon} className="text-blue-400" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h2 className={`${sizes.title} font-bold text-white leading-tight`} id="modal-title">
                {screenSize === 'xs' ? 'Devices' : isMobile ? 'Health Devices' : 'Connect Health Devices'}
              </h2>
              <p className={`${sizes.subtitle} text-gray-400 leading-relaxed mt-0.5`} id="modal-description">
                {isMobile ? 'Track health metrics in real-time' : 'Connect your devices to track health metrics in real-time'}
              </p>
              {(connectionStatus.googleFit || connectionStatus.smartwatch) && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">Devices Connected</span>
                </div>
              )}
            </div>
          </div>
          
            <motion.button
              onClick={onClose}
              className={`${screenSize === 'xs' ? 'p-2' : 'p-2.5'} bg-gray-800/80 hover:bg-gray-700 border border-gray-700/50 hover:border-gray-600 rounded-xl text-white transition-all duration-200 backdrop-blur-sm flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900`}
              whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              aria-label="Close modal"
              autoFocus
            >
              <X size={screenSize === 'xs' ? 16 : 18} aria-hidden="true" />
            </motion.button>
        </div>
        
        {/* Enhanced swipe indicator for mobile */}
        {isMobile && (
          <motion.div 
            className="flex justify-center mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 rounded-full"></div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const EnhancedTabNavigation = () => {
    const getTabLayout = () => {
      if (screenSize === 'xs') return { spacing: 'space-x-1', padding: 'px-2.5 py-2', text: 'text-xs' };
      if (screenSize === 'sm') return { spacing: 'space-x-2', padding: 'px-3 py-2.5', text: 'text-sm' };
      return { spacing: 'space-x-3', padding: 'px-4 py-3', text: 'text-base' };
    };
    
    const layout = getTabLayout();
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex ${layout.spacing} mb-6 p-1 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50`}
      >
        <motion.button
          onClick={() => setActiveTab('googlefit')}
          className={`flex items-center justify-center gap-2 ${layout.padding} ${layout.text} rounded-xl font-medium transition-all duration-300 flex-1 relative overflow-hidden ${
            activeTab === 'googlefit' 
              ? 'bg-gradient-to-r from-blue-600/90 to-blue-500/90 text-white shadow-lg border border-blue-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        >
          {activeTab === 'googlefit' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
              layoutId="activeTab"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <Smartphone size={screenSize === 'xs' ? 14 : screenSize === 'sm' ? 16 : 18} />
            <span className={screenSize === 'xs' ? 'hidden' : ''}>
              {screenSize === 'sm' || isMobile ? 'Google Fit' : 'Google Fit'}
            </span>
            {connectionStatus.googleFit && (
              <motion.div 
                className="w-2 h-2 bg-green-300 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
        </motion.button>
        
        <motion.button
          onClick={() => setActiveTab('smartwatch')}
          className={`flex items-center justify-center gap-2 ${layout.padding} ${layout.text} rounded-xl font-medium transition-all duration-300 flex-1 relative overflow-hidden ${
            activeTab === 'smartwatch' 
              ? 'bg-gradient-to-r from-purple-600/90 to-purple-500/90 text-white shadow-lg border border-purple-500/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        >
          {activeTab === 'smartwatch' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl"
              layoutId="activeTab"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <Watch size={screenSize === 'xs' ? 14 : screenSize === 'sm' ? 16 : 18} />
            <span className={screenSize === 'xs' ? 'hidden' : ''}>
              {screenSize === 'sm' || isMobile ? 'Smartwatch' : 'Smartwatch'}
            </span>
            {connectionStatus.smartwatch && (
              <motion.div 
                className="w-2 h-2 bg-blue-300 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
        </motion.button>
      </motion.div>
    );
  };

  const EnhancedFeatureCard = ({ feature, index, type }) => {
    const getCardLayout = () => {
      switch(screenSize) {
        case 'xs': return { padding: 'p-2.5', iconSize: 'w-8 h-8', iconSvg: 16, titleSize: 'text-xs', descSize: 'text-xs', valueSize: 'text-xs' };
        case 'sm': return { padding: 'p-3', iconSize: 'w-9 h-9', iconSvg: 17, titleSize: 'text-sm', descSize: 'text-xs', valueSize: 'text-xs' };
        case 'md': return { padding: 'p-3.5', iconSize: 'w-10 h-10', iconSvg: 18, titleSize: 'text-sm', descSize: 'text-sm', valueSize: 'text-sm' };
        case 'lg': return { padding: 'p-4', iconSize: 'w-11 h-11', iconSvg: 20, titleSize: 'text-base', descSize: 'text-sm', valueSize: 'text-sm' };
        default: return { padding: 'p-5', iconSize: 'w-12 h-12', iconSvg: 22, titleSize: 'text-lg', descSize: 'text-base', valueSize: 'text-base' };
      }
    };
    
    const layout = getCardLayout();
    const gradientClass = type === 'googlefit' 
      ? 'from-blue-500/20 via-cyan-500/20 to-green-500/20' 
      : 'from-purple-500/20 via-pink-500/20 to-rose-500/20';
    
    const borderClass = type === 'googlefit' 
      ? 'border-blue-500/20 hover:border-blue-400/30' 
      : 'border-purple-500/20 hover:border-purple-400/30';
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          delay: index * 0.08, 
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        whileHover={{ 
          y: -2, 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        className={`flex items-start gap-3 ${layout.padding} bg-gray-800/30 hover:bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl transition-all duration-300 group border ${borderClass} relative overflow-hidden`}
      >
        {/* Background gradient effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} rounded-xl sm:rounded-2xl`}></div>
        </div>
        
        <motion.div 
          className={`${layout.iconSize} rounded-xl bg-gradient-to-br ${gradientClass} backdrop-blur-sm border border-white/10 flex items-center justify-center flex-shrink-0 relative z-10`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <feature.icon size={layout.iconSvg} className={feature.color} />
        </motion.div>
        
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-start justify-between mb-1 gap-2">
            <h4 className={`text-white font-semibold ${layout.titleSize} leading-tight`}>
              {feature.label}
            </h4>
            <motion.span 
              className={`${feature.color} font-bold ${layout.valueSize} opacity-90 flex-shrink-0`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {feature.value}
            </motion.span>
          </div>
          <p className={`text-gray-400 ${layout.descSize} leading-relaxed`}>
            {feature.description}
          </p>
          
          {/* Feature highlight bar */}
          <motion.div
            className={`w-0 group-hover:w-full h-0.5 ${feature.color.replace('text-', 'bg-')} rounded-full mt-2 transition-all duration-300`}
            initial={{ width: 0 }}
            whileHover={{ width: '100%' }}
          />
        </div>
      </motion.div>
    );
  };

  const EnhancedConnectionStatusCard = () => {
    const getStatusLayout = () => {
      switch(screenSize) {
        case 'xs': return { padding: 'p-3', titleSize: 'text-sm', itemPadding: 'p-2.5', statusSize: 'text-xs px-2 py-1' };
        case 'sm': return { padding: 'p-3.5', titleSize: 'text-base', itemPadding: 'p-3', statusSize: 'text-xs px-2 py-1' };
        case 'md': return { padding: 'p-4', titleSize: 'text-base', itemPadding: 'p-3', statusSize: 'text-sm px-3 py-1.5' };
        default: return { padding: 'p-6', titleSize: 'text-lg', itemPadding: 'p-4', statusSize: 'text-sm px-3 py-1.5' };
      }
    };
    
    const layout = getStatusLayout();
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className={`bg-gray-800/20 backdrop-blur-xl rounded-2xl ${layout.padding} border border-gray-700/40 hover:border-gray-600/50 transition-all duration-300`}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className={`text-white font-bold ${layout.titleSize} flex items-center gap-2`}>
            <motion.div 
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 flex items-center justify-center"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Activity size={16} className="text-green-400" />
            </motion.div>
            Device Status
          </h4>
          
          <div className="flex items-center gap-2">
            {(connectionStatus.googleFit || connectionStatus.smartwatch) && (
              <motion.div 
                className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">Live</span>
              </motion.div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Google Fit Status */}
          <motion.div 
            className={`flex items-center justify-between ${layout.itemPadding} rounded-xl bg-gray-700/20 border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200 group`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${connectionStatus.googleFit ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {connectionStatus.googleFit && (
                    <motion.div 
                      className="absolute inset-0 bg-green-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Smartphone size={screenSize === 'xs' ? 14 : 16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                <div>
                  <span className={`text-white font-medium ${screenSize === 'xs' ? 'text-xs' : 'text-sm'} block`}>
                    Google Fit
                  </span>
                  <span className={`${connectionStatus.googleFit ? 'text-green-400' : 'text-gray-500'} text-xs`}>
                    {connectionStatus.googleFit ? 'Syncing data' : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>
            <motion.span 
              className={`${layout.statusSize} rounded-lg font-medium border transition-colors ${
                connectionStatus.googleFit 
                  ? 'bg-green-500/10 text-green-400 border-green-500/30' 
                  : 'bg-gray-600/10 text-gray-500 border-gray-600/30'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {connectionStatus.googleFit ? 'ON' : 'OFF'}
            </motion.span>
          </motion.div>

          {/* Smartwatch Status */}
          <motion.div 
            className={`flex items-center justify-between ${layout.itemPadding} rounded-xl bg-gray-700/20 border border-gray-600/30 hover:border-gray-500/40 transition-all duration-200 group`}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${connectionStatus.smartwatch ? 'bg-blue-500' : 'bg-gray-500'}`}>
                  {connectionStatus.smartwatch && (
                    <motion.div 
                      className="absolute inset-0 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Watch size={screenSize === 'xs' ? 14 : 16} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-white font-medium ${screenSize === 'xs' ? 'text-xs' : 'text-sm'}`}>
                      Smartwatch
                    </span>
                    {smartwatchDevices.length > 0 && batteryLevel && (
                      <div className="flex items-center gap-1">
                        <Battery size={10} className="text-green-400" />
                        <span className="text-xs text-green-400 font-medium">{batteryLevel}%</span>
                      </div>
                    )}
                  </div>
                  <span className={`${connectionStatus.smartwatch ? 'text-blue-400' : 'text-gray-500'} text-xs`}>
                    {connectionStatus.smartwatch ? 'Real-time sync' : 'Not connected'}
                  </span>
                </div>
              </div>
            </div>
            <motion.span 
              className={`${layout.statusSize} rounded-lg font-medium border transition-colors ${
                connectionStatus.smartwatch 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                  : 'bg-gray-600/10 text-gray-500 border-gray-600/30'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {connectionStatus.smartwatch ? 'ON' : 'OFF'}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  // Get responsive modal dimensions
  const getModalConfig = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (width < 480) {
      return {
        containerClass: 'items-end',
        modalClass: 'rounded-t-3xl w-full h-[88vh]',
        padding: 'p-3',
        maxWidth: 'w-full'
      };
    } else if (width < 768) {
      return {
        containerClass: 'items-center justify-center',
        modalClass: 'rounded-2xl w-full max-w-md h-[85vh]',
        padding: 'p-4',
        maxWidth: 'max-w-md'
      };
    } else if (width < 1024) {
      return {
        containerClass: 'items-center justify-center',
        modalClass: 'rounded-2xl w-full max-w-2xl max-h-[90vh]',
        padding: 'p-5',
        maxWidth: 'max-w-2xl'
      };
    } else if (width < 1440) {
      return {
        containerClass: 'items-center justify-center',
        modalClass: 'rounded-3xl w-full max-w-4xl max-h-[90vh]',
        padding: 'p-6',
        maxWidth: 'max-w-4xl'
      };
    } else {
      return {
        containerClass: 'items-center justify-center',
        modalClass: 'rounded-3xl w-full max-w-6xl max-h-[90vh]',
        padding: 'p-8',
        maxWidth: 'max-w-6xl'
      };
    }
  };
  
  const modalConfig = getModalConfig();

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 bg-black/70 backdrop-blur-md flex ${modalConfig.containerClass} z-50 ${isMobile ? 'p-0' : 'p-4'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={isMobile ? undefined : onClose}
      >
        <motion.div
          ref={modalRef}
          className={`bg-gray-900/95 backdrop-blur-2xl border border-gray-700/40 shadow-2xl overflow-hidden ${modalConfig.modalClass}`}
          initial={shouldReduceMotion ? false : {
            scale: screenSize === 'xs' ? 0.95 : 0.9,
            opacity: 0,
            y: screenSize === 'xs' ? 100 : 20
          }}
          animate={shouldReduceMotion ? false : {
            scale: 1,
            opacity: 1,
            y: 0
          }}
          exit={shouldReduceMotion ? false : {
            scale: screenSize === 'xs' ? 0.95 : 0.9,
            opacity: 0,
            y: screenSize === 'xs' ? 100 : 20
          }}
          transition={shouldReduceMotion ? {} : { 
            type: "spring", 
            damping: 30, 
            stiffness: 300,
            mass: 0.8
          }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className={`${modalConfig.padding} h-full overflow-y-auto scrollbar-hide`}>
            <ResponsiveHeader />
            <EnhancedTabNavigation />
            
            {/* Progress Steps for Mobile */}
            {isMobile && currentStep !== 'overview' && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Connection Progress</span>
                  <span className="text-xs text-blue-400">
                    {currentStep === 'connecting' ? 'Connecting...' : currentStep === 'success' ? 'Success!' : ''}
                  </span>
                </div>
                <div className="w-full bg-gray-700/30 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: currentStep === 'connecting' ? '70%' : currentStep === 'success' ? '100%' : '0%'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Enhanced responsive layout */}
            <div className={`grid gap-4 sm:gap-6 ${
              screenSize === 'xs' ? 'grid-cols-1' 
                : screenSize === 'sm' ? 'grid-cols-1' 
                : screenSize === 'md' ? 'grid-cols-1 lg:grid-cols-2' 
                : 'grid-cols-1 xl:grid-cols-2'
            }`}>
              {/* Device Info Section */}
              <div className={`space-y-4 sm:space-y-6 ${screenSize === 'xl' ? 'order-1' : ''}`}>
                <AnimatePresence mode="wait">
                  {activeTab === 'googlefit' && (
                    <motion.div
                      key="googlefit"
                      initial={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? 20 : 0 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? -20 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-gradient-to-br from-blue-900/30 to-green-900/30 p-4 sm:p-6 rounded-2xl border border-blue-700/30 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br from-blue-500/30 to-green-500/30 flex items-center justify-center`}>
                            <Smartphone size={isMobile ? 24 : 28} className="text-blue-400" />
                          </div>
                          <div>
                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>Google Fit</h3>
                            <p className="text-gray-400 text-sm">Comprehensive health tracking</p>
                          </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          {deviceFeatures.googlefit.map((feature, index) => (
                            <EnhancedFeatureCard key={index} feature={feature} index={index} type="googlefit" />
                          ))}
                        </div>
                        
                        {/* Quick Stats for Mobile */}
                        {isMobile && (
                          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/40 rounded-xl">
                            <p className="text-blue-400 text-xs mb-2 font-medium">Today's Overview</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-white">Steps: <span className="text-blue-400">8,247</span></div>
                              <div className="text-white">Calories: <span className="text-orange-400">1,890</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'smartwatch' && (
                    <motion.div
                      key="smartwatch"
                      initial={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? 20 : 0 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, x: isMobile ? 0 : -20, y: isMobile ? -20 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-4 sm:p-6 rounded-2xl border border-purple-700/30 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center`}>
                            <Watch size={isMobile ? 24 : 28} className="text-purple-400" />
                          </div>
                          <div>
                            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>Smartwatch</h3>
                            <p className="text-gray-400 text-sm">Real-time fitness monitoring</p>
                          </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                          {deviceFeatures.smartwatch.map((feature, index) => (
                            <EnhancedFeatureCard key={index} feature={feature} index={index} type="smartwatch" />
                          ))}
                        </div>
                        
                        {/* Supported Devices */}
                        {!isMobile && (
                          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-700/40 rounded-xl">
                            <p className="text-purple-400 text-sm mb-3 font-medium">Supported Devices</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {supportedDevices.smartwatch.slice(0, 4).map((device, index) => (
                                <div key={index} className="flex items-center gap-2 text-gray-300">
                                  <span>{device.icon}</span>
                                  <span>{device.brand}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mobile Warning */}
                        <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl">
                          <p className="text-yellow-400 text-xs sm:text-sm">
                            <strong>Note:</strong> {isMobile ? 'Enable Bluetooth for pairing.' : 'Ensure your smartwatch is in pairing mode and Bluetooth is enabled.'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Connection Interface Section */}
              <div className={`space-y-4 sm:space-y-6 ${screenSize === 'xl' ? 'order-2' : ''}`}>
                <EnhancedConnectionStatusCard />
                
                {/* Connection Actions */}
                <div className="bg-gray-800/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-700/50">
                  <h4 className={`text-white font-bold ${isMobile ? 'text-base' : 'text-lg'} mb-4 flex items-center gap-2`}>
                    <div className={`w-8 h-8 rounded-lg ${activeTab === 'googlefit' ? 'bg-blue-500/20' : 'bg-purple-500/20'} flex items-center justify-center`}>
                      {activeTab === 'googlefit' ? (
                        <Smartphone size={16} className="text-blue-400" />
                      ) : (
                        <Watch size={16} className="text-purple-400" />
                      )}
                    </div>
                    {activeTab === 'googlefit' ? 'Google Fit Connection' : 'Smartwatch Connection'}
                  </h4>

                  <AnimatePresence mode="wait">
                    {activeTab === 'googlefit' && (
                      <motion.div
                        key="googlefit-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {!connectionStatus.googleFit ? (
                          <>
                            <button
                              onClick={handleGoogleFitConnect}
                              disabled={isConnecting}
                              className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'py-3.5 px-4' : 'py-3 px-4'} bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]`}
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" />
                                  {isMobile ? 'Connecting...' : 'Connecting to Google Fit...'}
                                </>
                              ) : (
                                <>
                                  <Smartphone size={20} />
                                  {isMobile ? 'Connect Fit' : 'Connect Google Fit'}
                                  <ExternalLink size={16} className="opacity-60" />
                                </>
                              )}
                            </button>
                            
                            {/* Instructions for mobile */}
                            {isMobile && (
                              <div className="p-3 bg-blue-900/20 border border-blue-700/40 rounded-xl">
                                <p className="text-blue-400 text-xs">
                                  📱 You'll be redirected to Google to authorize access
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className={`flex items-center gap-3 p-3 ${isMobile ? 'rounded-xl' : 'rounded-lg'} bg-green-500/10 border border-green-500/30`}>
                              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <CheckCircle size={16} className="text-green-400" />
                              </div>
                              <div className="flex-1">
                                <span className={`text-green-400 font-semibold ${isMobile ? 'text-sm' : ''}`}>Google Fit Connected</span>
                                <p className="text-green-400/70 text-xs">Syncing health data automatically</p>
                              </div>
                            </div>
                            
                            <button
                              onClick={handleGoogleFitDisconnect}
                              disabled={isConnecting}
                              className={`w-full ${isMobile ? 'py-2.5 px-4' : 'py-2 px-4'} bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 rounded-xl text-red-400 font-medium transition-all duration-200 active:scale-[0.98]`}
                            >
                              {isMobile ? 'Disconnect' : 'Disconnect Google Fit'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'smartwatch' && (
                      <motion.div
                        key="smartwatch-actions"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {!connectionStatus.smartwatch ? (
                          <>
                            <button
                              onClick={handleSmartwatchConnect}
                              disabled={isConnecting}
                              className={`w-full flex items-center justify-center gap-2 ${isMobile ? 'py-3.5 px-4' : 'py-3 px-4'} bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 active:scale-[0.98]`}
                            >
                              {isConnecting ? (
                                <>
                                  <Loader2 size={20} className="animate-spin" />
                                  {currentStep === 'connecting' ? 'Connecting...' : 'Searching...'}
                                </>
                              ) : (
                                <>
                                  <Bluetooth size={20} />
                                  {isMobile ? 'Pair Watch' : 'Pair Smartwatch'}
                                  <Vibrate size={16} className="opacity-60" />
                                </>
                              )}
                            </button>
                            
                            {/* Bluetooth status for mobile */}
                            {isMobile && (
                              <div className="p-3 bg-purple-900/20 border border-purple-700/40 rounded-xl">
                                <p className="text-purple-400 text-xs">
                                  🔵 Make sure Bluetooth is enabled and device is discoverable
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className={`flex items-center gap-3 p-3 ${isMobile ? 'rounded-xl' : 'rounded-lg'} bg-blue-500/10 border border-blue-500/30`}>
                              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <CheckCircle size={16} className="text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <span className={`text-blue-400 font-semibold ${isMobile ? 'text-sm' : ''}`}>Smartwatch Connected</span>
                                <p className="text-blue-400/70 text-xs">Real-time data streaming</p>
                              </div>
                              {batteryLevel && (
                                <div className="flex items-center gap-1">
                                  <Battery size={14} className="text-green-400" />
                                  <span className="text-xs text-green-400 font-medium">{batteryLevel}%</span>
                                </div>
                              )}
                            </div>
                            
                            {smartwatchDevices.length > 0 && (
                              <div className={`p-3 bg-gray-700/30 border border-gray-600/30 ${isMobile ? 'rounded-xl' : 'rounded-lg'}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'} mb-1`}>Connected Device:</p>
                                    <p className={`text-white font-medium ${isMobile ? 'text-sm' : ''}`}>{smartwatchDevices[0].name}</p>
                                  </div>
                                  {signalStrength && (
                                    <div className="flex items-center gap-1">
                                      <Signal size={14} className="text-blue-400" />
                                      <span className="text-xs text-blue-400">{signalStrength}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <button
                              onClick={handleSmartwatchDisconnect}
                              disabled={isConnecting}
                              className={`w-full ${isMobile ? 'py-2.5 px-4' : 'py-2 px-4'} bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-600/50 rounded-xl text-red-400 font-medium transition-all duration-200 active:scale-[0.98]`}
                            >
                              {isMobile ? 'Disconnect' : 'Disconnect Smartwatch'}
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {connectionError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={`mt-4 p-3 bg-red-900/20 border border-red-700/40 ${isMobile ? 'rounded-xl' : 'rounded-lg'} backdrop-blur-sm`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertCircle size={14} className="text-red-400" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-red-400 ${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed`}>{connectionError}</p>
                            <button
                              onClick={() => setConnectionError('')}
                              className="text-red-400/60 hover:text-red-400 text-xs mt-1 transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

DevicePairingModal.displayName = 'DevicePairingModal';

export default DevicePairingModal;
