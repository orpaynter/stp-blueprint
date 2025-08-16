import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { RNCamera } from 'react-native-camera';
import { Text, Button, IconButton, Surface, ActivityIndicator, Chip } from 'react-native-paper';
import { useOffline } from '../../contexts/OfflineContext';
import { theme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';
import Voice from 'react-native-voice';

const CameraScreen = ({ navigation, route }) => {
  const { projectId, assessmentId } = route.params || {};
  const { isConnected, queueImageUpload, queueVoiceNote } = useOffline();
  const [flashMode, setFlashMode] = useState(RNCamera.Constants.FlashMode.off);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceResults, setVoiceResults] = useState('');
  const [damageDetections, setDamageDetections] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      // Cleanup voice recognition
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const toggleFlash = () => {
    setFlashMode(
      flashMode === RNCamera.Constants.FlashMode.off
        ? RNCamera.Constants.FlashMode.on
        : RNCamera.Constants.FlashMode.off
    );
  };

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const options = { quality: 0.85, base64: true };
        const data = await cameraRef.current.takePictureAsync(options);
        
        // Add to captured images
        const newImage = {
          uri: data.uri,
          base64: data.base64,
          width: data.width,
          height: data.height,
          timestamp: new Date().toISOString(),
        };
        
        setCapturedImages([...capturedImages, newImage]);
        
        // If offline, queue the image for later upload
        if (!isConnected) {
          await queueImageUpload({
            projectId,
            assessmentId,
            image: newImage,
            type: 'damage_assessment'
          });
          Alert.alert('Image Saved', 'The image has been saved for upload when you are back online.');
        } else {
          // Simulate AI damage detection
          simulateDamageDetection(newImage);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const simulateDamageDetection = (image) => {
    // Simulate processing delay
    setTimeout(() => {
      // Simulate damage detection results
      const newDetection = {
        id: `detection_${Date.now()}`,
        imageUri: image.uri,
        damages: [
          {
            type: 'Hail Damage',
            confidence: 0.92,
            boundingBox: {
              x: Math.random() * (image.width - 100),
              y: Math.random() * (image.height - 100),
              width: 100,
              height: 100
            }
          },
          {
            type: 'Missing Shingles',
            confidence: 0.87,
            boundingBox: {
              x: Math.random() * (image.width - 150),
              y: Math.random() * (image.height - 150),
              width: 150,
              height: 150
            }
          }
        ]
      };
      
      setDamageDetections([...damageDetections, newDetection]);
      Alert.alert('Damage Detected', 'AI has detected potential roof damage in the image.');
    }, 2000);
  };

  const pickImage = () => {
    ImagePicker.launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.8,
    }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      } else {
        const asset = response.assets[0];
        const newImage = {
          uri: asset.uri,
          base64: asset.base64,
          width: asset.width,
          height: asset.height,
          timestamp: new Date().toISOString(),
        };
        
        setCapturedImages([...capturedImages, newImage]);
        
        if (!isConnected) {
          queueImageUpload({
            projectId,
            assessmentId,
            image: newImage,
            type: 'damage_assessment'
          });
          Alert.alert('Image Saved', 'The image has been saved for upload when you are back online.');
        } else {
          simulateDamageDetection(newImage);
        }
      }
    });
  };

  // Voice note functions
  const startVoiceRecording = async () => {
    try {
      await Voice.start('en-US');
      setIsRecordingVoice(true);
      setVoiceResults('');
    } catch (e) {
      console.error('Error starting voice recording:', e);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      await Voice.stop();
      setIsRecordingVoice(false);
    } catch (e) {
      console.error('Error stopping voice recording:', e);
    }
  };

  const onSpeechStart = () => {
    console.log('Speech started');
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
  };

  const onSpeechResults = (e) => {
    const result = e.value[0];
    setVoiceResults(result);
    
    // Save voice note
    if (result) {
      const newVoiceNote = {
        id: `voice_${Date.now()}`,
        text: result,
        timestamp: new Date().toISOString()
      };
      
      setVoiceNotes([...voiceNotes, newVoiceNote]);
      
      if (!isConnected) {
        queueVoiceNote({
          projectId,
          assessmentId,
          voiceNote: newVoiceNote
        });
        Alert.alert('Voice Note Saved', 'The voice note has been saved for upload when you are back online.');
      }
    }
  };

  const onSpeechError = (e) => {
    console.error('Speech recognition error:', e);
  };

  const completeAssessment = () => {
    // Navigate to assessment review screen with captured data
    navigation.navigate('AssessmentDetail', {
      assessmentId,
      projectId,
      capturedImages,
      voiceNotes,
      damageDetections
    });
  };

  return (
    <View style={styles.container}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={flashMode}
        androidCameraPermissionOptions={{
          title: 'Permission to use camera',
          message: 'We need your permission to use your camera',
          buttonPositive: 'Ok',
          buttonNegative: 'Cancel',
        }}
      >
        {({ camera, status }) => {
          if (status !== 'READY') {
            return (
              <View style={styles.cameraNotReady}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.cameraNotReadyText}>Camera initializing...</Text>
              </View>
            );
          }
          
          return (
            <View style={styles.cameraControls}>
              {/* Connection status indicator */}
              <View style={styles.connectionStatus}>
                {isConnected ? (
                  <Chip icon="wifi" mode="outlined" style={styles.onlineChip}>Online</Chip>
                ) : (
                  <Chip icon="wifi-off" mode="outlined" style={styles.offlineChip}>Offline</Chip>
                )}
              </View>
              
              {/* Damage detection overlays */}
              {damageDetections.length > 0 && damageDetections[damageDetections.length - 1].damages.map((damage, index) => (
                <View
                  key={`damage_${index}`}
                  style={[
                    styles.damageOverlay,
                    {
                      left: damage.boundingBox.x / 4,
                      top: damage.boundingBox.y / 4,
                      width: damage.boundingBox.width / 2,
                      height: damage.boundingBox.height / 2,
                    }
                  ]}
                >
                  <Text style={styles.damageType}>{damage.type}</Text>
                  <Text style={styles.damageConfidence}>{Math.round(damage.confidence * 100)}%</Text>
                </View>
              ))}
              
              {/* Voice recording indicator */}
              {isRecordingVoice && (
                <View style={styles.voiceRecordingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.accent} />
                  <Text style={styles.voiceRecordingText}>Recording voice note...</Text>
                </View>
              )}
              
              {/* Voice results */}
              {voiceResults && (
                <Surface style={styles.voiceResultsContainer}>
                  <Text style={styles.voiceResultsText}>{voiceResults}</Text>
                </Surface>
              )}
              
              {/* Bottom controls */}
              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={pickImage} style={styles.controlButton}>
                  <Icon name="image" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={takePicture} style={styles.captureButton} disabled={isProcessing}>
                  {isProcessing ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                  ) : (
                    <Icon name="camera" size={36} color="white" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                  style={[styles.controlButton, isRecordingVoice && styles.recordingButton]}
                >
                  <Icon name="microphone" size={28} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Top controls */}
              <View style={styles.topControls}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Icon name="arrow-left" size={28} color="white" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={toggleFlash} style={styles.flashButton}>
                  <Icon
                    name={flashMode === RNCamera.Constants.FlashMode.off ? "flash-off" : "flash"}
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
              
              {/* Complete button */}
              {capturedImages.length > 0 && (
                <TouchableOpacity onPress={completeAssessment} style={styles.completeButton}>
                  <Text style={styles.completeButtonText}>Complete Assessment</Text>
                  <Icon name="check" size={20} color="white" />
                </TouchableOpacity>
              )}
              
              {/* Thumbnail preview */}
              {capturedImages.length > 0 && (
                <View style={styles.thumbnailContainer}>
                  {capturedImages.slice(-3).map((image, index) => (
                    <Image
                      key={`thumb_${index}`}
                      source={{ uri: image.uri }}
                      style={styles.thumbnail}
                    />
                  ))}
                  {capturedImages.length > 3 && (
                    <View style={styles.moreImagesIndicator}>
                      <Text style={styles.moreImagesText}>+{capturedImages.length - 3}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      </RNCamera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraNotReady: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  cameraNotReadyText: {
    color: 'white',
    marginTop: 10,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  connectionStatus: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  onlineChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  offlineChip: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: theme.colors.accent,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: theme.colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  thumbnailContainer: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  moreImagesIndicator: {
    width: 60,
    height: 60,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  moreImagesText: {
    color: 'white',
    fontWeight: 'bold',
  },
  voiceRecordingIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceRecordingText: {
    color: 'white',
    marginLeft: 10,
  },
  voiceResultsContainer: {
    position: 'absolute',
    bottom: 220,
    left: 20,
    right: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  voiceResultsText: {
    color: theme.colors.text,
  },
  damageOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  damageType: {
    color: 'white',
    fontWeight: 
(Content truncated due to size limit. Use line ranges to read in chunks)