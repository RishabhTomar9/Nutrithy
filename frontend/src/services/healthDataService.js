import { 
  auth, 
  db, 
  GoogleAuthProvider, 
  signInWithRedirect,
  getRedirectResult,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from '../firebase';

class HealthDataService {
  constructor() {
    this.googleFitScopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.nutrition.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.sleep.read'
    ];
    this.accessToken = null;
  }

  // Check for pending redirect result on app initialization
  async checkRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.credential) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        this.accessToken = credential.accessToken;
        
        // Save connection status
        if (result.user) {
          await this.saveConnectionStatus(result.user.uid, {
            googleFitConnected: true,
            connectedAt: new Date(),
            accessToken: this.accessToken
          });
        }
        
        return {
          success: true,
          accessToken: this.accessToken
        };
      }
    } catch (error) {
      console.error('Error checking redirect result:', error);
      throw error;
    }
    return null;
  }

  // Connect Google Fit with Firebase Auth (using redirect)
  async connectGoogleFit() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be logged in to connect Google Fit');
      }

      // Create Google provider with fitness scopes
      const provider = new GoogleAuthProvider();
      this.googleFitScopes.forEach(scope => {
        provider.addScope(scope);
      });
      
      // Use redirect instead of popup for better compatibility
      await signInWithRedirect(auth, provider);
      
      // The actual result will be handled by checkRedirectResult()
      return { success: true, pending: true };
    } catch (error) {
      console.error('Google Fit connection error:', error);
      throw error;
    }
  }

  // Disconnect Google Fit
  async disconnectGoogleFit() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Revoke Google access
      if (this.accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        });
      }

      // Update Firestore
      await this.saveConnectionStatus(user.uid, {
        googleFitConnected: false,
        disconnectedAt: new Date(),
        accessToken: null
      });

      this.accessToken = null;
    } catch (error) {
      console.error('Error disconnecting Google Fit:', error);
      throw error;
    }
  }

  // Fetch health data from Google Fit
  async fetchHealthData(startDate, endDate) {
    try {
      if (!this.accessToken) {
        throw new Error('Google Fit not connected');
      }

      const startTimeMillis = startDate.getTime();
      const endTimeMillis = endDate.getTime();

      // Fetch different types of health data
      const [steps, heartRate, calories, distance, sleep] = await Promise.allSettled([
        this.fetchStepsData(startTimeMillis, endTimeMillis),
        this.fetchHeartRateData(startTimeMillis, endTimeMillis),
        this.fetchCaloriesData(startTimeMillis, endTimeMillis),
        this.fetchDistanceData(startTimeMillis, endTimeMillis),
        this.fetchSleepData(startTimeMillis, endTimeMillis)
      ]);

      const healthData = {
        steps: steps.status === 'fulfilled' ? steps.value : 0,
        heartRate: heartRate.status === 'fulfilled' ? heartRate.value : null,
        calories: calories.status === 'fulfilled' ? calories.value : 0,
        distance: distance.status === 'fulfilled' ? distance.value : 0,
        sleep: sleep.status === 'fulfilled' ? sleep.value : null,
        lastUpdate: new Date()
      };

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        await this.saveHealthData(user.uid, healthData);
      }

      return healthData;
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  }

  // Fetch steps data using REST API
  async fetchStepsData(startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let totalSteps = 0;
      
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              totalSteps += point.value[0].intVal || 0;
            });
          }
        });
      }
      return totalSteps;
    } catch (error) {
      console.error('Error fetching steps data:', error);
      return 0;
    }
  }

  // Fetch heart rate data using REST API
  async fetchHeartRateData(startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.heart_rate.bpm'
          }],
          bucketByTime: { durationMillis: 3600000 }, // 1 hour
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const heartRateData = [];
      
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              heartRateData.push({
                value: point.value[0].fpVal,
                timestamp: new Date(parseInt(point.startTimeNanos) / 1000000)
              });
            });
          }
        });
      }
      return heartRateData.length > 0 ? heartRateData[heartRateData.length - 1] : null;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return null;
    }
  }

  // Fetch calories data using REST API
  async fetchCaloriesData(startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.calories.expended'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let totalCalories = 0;
      
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              totalCalories += point.value[0].fpVal || 0;
            });
          }
        });
      }
      return totalCalories;
    } catch (error) {
      console.error('Error fetching calories data:', error);
      return 0;
    }
  }

  // Fetch distance data using REST API
  async fetchDistanceData(startTimeMillis, endTimeMillis) {
    try {
      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aggregateBy: [{
            dataTypeName: 'com.google.distance.delta'
          }],
          bucketByTime: { durationMillis: 86400000 }, // 1 day
          startTimeMillis: startTimeMillis.toString(),
          endTimeMillis: endTimeMillis.toString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let totalDistance = 0;
      
      if (data.bucket) {
        data.bucket.forEach(bucket => {
          if (bucket.dataset && bucket.dataset[0].point) {
            bucket.dataset[0].point.forEach(point => {
              totalDistance += point.value[0].fpVal || 0; // in meters
            });
          }
        });
      }
      return totalDistance / 1000; // convert to kilometers
    } catch (error) {
      console.error('Error fetching distance data:', error);
      return 0;
    }
  }

  // Fetch sleep data using REST API
  async fetchSleepData(startTimeMillis, endTimeMillis) {
    try {
      const startTime = new Date(startTimeMillis).toISOString();
      const endTime = new Date(endTimeMillis).toISOString();
      
      const response = await fetch(`https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}&activityType=72`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.session && data.session.length > 0) {
        const sleepSession = data.session[0];
        const duration = (new Date(sleepSession.endTimeMillis) - new Date(sleepSession.startTimeMillis)) / (1000 * 60 * 60);
        return {
          hours: duration.toFixed(1),
          quality: Math.floor(Math.random() * 30) + 70 // Mock quality for now
        };
      }
    } catch (error) {
      console.error('Error fetching sleep data:', error);
    }
    return null;
  }

  // Save connection status to Firestore
  async saveConnectionStatus(userId, status) {
    const docRef = doc(db, 'users', userId, 'health', 'connections');
    await setDoc(docRef, status, { merge: true });
  }

  // Save health data to Firestore
  async saveHealthData(userId, healthData) {
    const docRef = doc(db, 'users', userId, 'health', 'data');
    const dailyData = {
      [this.getDateString(new Date())]: healthData
    };
    await setDoc(docRef, dailyData, { merge: true });
  }

  // Get connection status
  async getConnectionStatus(userId) {
    const docRef = doc(db, 'users', userId, 'health', 'connections');
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  // Get health data
  async getHealthData(userId, date = new Date()) {
    const docRef = doc(db, 'users', userId, 'health', 'data');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data[this.getDateString(date)] || null;
    }
    return null;
  }

  // Listen to real-time health data updates
  subscribeToHealthData(userId, callback) {
    const docRef = doc(db, 'users', userId, 'health', 'data');
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const today = this.getDateString(new Date());
        callback(data[today] || null);
      }
    });
  }

  // Utility function to get date string
  getDateString(date) {
    return date.toISOString().split('T')[0];
  }

  // Check if Google Fit is connected
  async isConnected(userId) {
    const status = await this.getConnectionStatus(userId);
    return status?.googleFitConnected || false;
  }
}

// Singleton instance
const healthDataService = new HealthDataService();
export default healthDataService;
