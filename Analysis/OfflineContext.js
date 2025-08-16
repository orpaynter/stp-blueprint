import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineContext = createContext();

export const useOffline = () => useContext(OfflineContext);

export const OfflineProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [offlineData, setOfflineData] = useState({
    pendingAssessments: [],
    pendingClaims: [],
    pendingUploads: [],
    pendingVoiceNotes: []
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      
      // If connection is restored, attempt to sync
      if (state.isConnected && !isConnected) {
        syncOfflineData();
      }
    });

    // Load any stored offline data
    loadOfflineData();

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  // Load offline data from storage
  const loadOfflineData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('offlineData');
      if (storedData) {
        setOfflineData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to load offline data', error);
    }
  };

  // Save offline data to storage
  const saveOfflineData = async (data) => {
    try {
      const updatedData = { ...offlineData, ...data };
      await AsyncStorage.setItem('offlineData', JSON.stringify(updatedData));
      setOfflineData(updatedData);
    } catch (error) {
      console.error('Failed to save offline data', error);
    }
  };

  // Add assessment to offline queue
  const queueAssessment = async (assessment) => {
    try {
      const updatedAssessments = [...offlineData.pendingAssessments, {
        ...assessment,
        id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }];
      
      await saveOfflineData({ pendingAssessments: updatedAssessments });
      return true;
    } catch (error) {
      console.error('Failed to queue assessment', error);
      return false;
    }
  };

  // Add claim to offline queue
  const queueClaim = async (claim) => {
    try {
      const updatedClaims = [...offlineData.pendingClaims, {
        ...claim,
        id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }];
      
      await saveOfflineData({ pendingClaims: updatedClaims });
      return true;
    } catch (error) {
      console.error('Failed to queue claim', error);
      return false;
    }
  };

  // Add image upload to offline queue
  const queueImageUpload = async (imageData) => {
    try {
      const updatedUploads = [...offlineData.pendingUploads, {
        ...imageData,
        id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }];
      
      await saveOfflineData({ pendingUploads: updatedUploads });
      return true;
    } catch (error) {
      console.error('Failed to queue image upload', error);
      return false;
    }
  };

  // Add voice note to offline queue
  const queueVoiceNote = async (voiceNote) => {
    try {
      const updatedVoiceNotes = [...offlineData.pendingVoiceNotes, {
        ...voiceNote,
        id: `offline_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      }];
      
      await saveOfflineData({ pendingVoiceNotes: updatedVoiceNotes });
      return true;
    } catch (error) {
      console.error('Failed to queue voice note', error);
      return false;
    }
  };

  // Sync all offline data when back online
  const syncOfflineData = async () => {
    if (!isConnected || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Process each type of offline data
      await syncAssessments();
      await syncClaims();
      await syncUploads();
      await syncVoiceNotes();
      
      setIsSyncing(false);
    } catch (error) {
      console.error('Failed to sync offline data', error);
      setIsSyncing(false);
    }
  };

  // Sync assessments with server
  const syncAssessments = async () => {
    const { pendingAssessments } = offlineData;
    if (pendingAssessments.length === 0) return;
    
    const successfulSyncs = [];
    const failedSyncs = [];
    
    // Process each pending assessment
    for (const assessment of pendingAssessments) {
      try {
        // API call would go here
        // const response = await api.assessments.create(assessment);
        
        // For now, simulate successful sync
        successfulSyncs.push(assessment.id);
      } catch (error) {
        console.error(`Failed to sync assessment ${assessment.id}`, error);
        failedSyncs.push(assessment.id);
      }
    }
    
    // Remove successfully synced assessments
    if (successfulSyncs.length > 0) {
      const updatedAssessments = pendingAssessments.filter(
        assessment => !successfulSyncs.includes(assessment.id)
      );
      await saveOfflineData({ pendingAssessments: updatedAssessments });
    }
  };

  // Sync claims with server
  const syncClaims = async () => {
    const { pendingClaims } = offlineData;
    if (pendingClaims.length === 0) return;
    
    const successfulSyncs = [];
    const failedSyncs = [];
    
    // Process each pending claim
    for (const claim of pendingClaims) {
      try {
        // API call would go here
        // const response = await api.claims.create(claim);
        
        // For now, simulate successful sync
        successfulSyncs.push(claim.id);
      } catch (error) {
        console.error(`Failed to sync claim ${claim.id}`, error);
        failedSyncs.push(claim.id);
      }
    }
    
    // Remove successfully synced claims
    if (successfulSyncs.length > 0) {
      const updatedClaims = pendingClaims.filter(
        claim => !successfulSyncs.includes(claim.id)
      );
      await saveOfflineData({ pendingClaims: updatedClaims });
    }
  };

  // Sync image uploads with server
  const syncUploads = async () => {
    const { pendingUploads } = offlineData;
    if (pendingUploads.length === 0) return;
    
    const successfulSyncs = [];
    const failedSyncs = [];
    
    // Process each pending upload
    for (const upload of pendingUploads) {
      try {
        // API call would go here
        // const response = await api.uploads.upload(upload);
        
        // For now, simulate successful sync
        successfulSyncs.push(upload.id);
      } catch (error) {
        console.error(`Failed to sync upload ${upload.id}`, error);
        failedSyncs.push(upload.id);
      }
    }
    
    // Remove successfully synced uploads
    if (successfulSyncs.length > 0) {
      const updatedUploads = pendingUploads.filter(
        upload => !successfulSyncs.includes(upload.id)
      );
      await saveOfflineData({ pendingUploads: updatedUploads });
    }
  };

  // Sync voice notes with server
  const syncVoiceNotes = async () => {
    const { pendingVoiceNotes } = offlineData;
    if (pendingVoiceNotes.length === 0) return;
    
    const successfulSyncs = [];
    const failedSyncs = [];
    
    // Process each pending voice note
    for (const voiceNote of pendingVoiceNotes) {
      try {
        // API call would go here
        // const response = await api.voiceNotes.upload(voiceNote);
        
        // For now, simulate successful sync
        successfulSyncs.push(voiceNote.id);
      } catch (error) {
        console.error(`Failed to sync voice note ${voiceNote.id}`, error);
        failedSyncs.push(voiceNote.id);
      }
    }
    
    // Remove successfully synced voice notes
    if (successfulSyncs.length > 0) {
      const updatedVoiceNotes = pendingVoiceNotes.filter(
        voiceNote => !successfulSyncs.includes(voiceNote.id)
      );
      await saveOfflineData({ pendingVoiceNotes: updatedVoiceNotes });
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isConnected,
        isSyncing,
        offlineData,
        queueAssessment,
        queueClaim,
        queueImageUpload,
        queueVoiceNote,
        syncOfflineData
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineContext;
