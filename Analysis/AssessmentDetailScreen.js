import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Chip, Divider, ActivityIndicator, Surface } from 'react-native-paper';
import { useOffline } from '../../contexts/OfflineContext';
import { theme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AssessmentDetailScreen = ({ navigation, route }) => {
  const { assessmentId, projectId, capturedImages, voiceNotes, damageDetections } = route.params || {};
  const { isConnected } = useOffline();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [costEstimate, setCostEstimate] = useState(null);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);

  useEffect(() => {
    // Fetch assessment details or use passed data
    if (assessmentId) {
      fetchAssessmentDetails();
    } else if (capturedImages) {
      // Create a new assessment from captured data
      const newAssessment = {
        id: `temp_${Date.now()}`,
        projectId: projectId,
        status: 'draft',
        type: 'damage_assessment',
        createdAt: new Date().toISOString(),
        images: capturedImages || [],
        voiceNotes: voiceNotes || [],
        damageDetections: damageDetections || [],
      };
      setAssessment(newAssessment);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [assessmentId, projectId]);

  const fetchAssessmentDetails = async () => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockAssessment = {
        id: assessmentId,
        projectId: projectId,
        status: 'in_progress',
        type: 'damage_assessment',
        createdAt: '2023-04-10T14:30:00Z',
        images: capturedImages || [
          {
            uri: 'https://example.com/roof1.jpg',
            timestamp: '2023-04-10T14:35:00Z',
          },
          {
            uri: 'https://example.com/roof2.jpg',
            timestamp: '2023-04-10T14:36:00Z',
          }
        ],
        voiceNotes: voiceNotes || [
          {
            id: 'voice_1',
            text: 'Significant hail damage on the north side of the roof.',
            timestamp: '2023-04-10T14:38:00Z'
          }
        ],
        damageDetections: damageDetections || [
          {
            id: 'detection_1',
            imageUri: 'https://example.com/roof1.jpg',
            damages: [
              {
                type: 'Hail Damage',
                confidence: 0.92,
                boundingBox: {
                  x: 120,
                  y: 150,
                  width: 100,
                  height: 100
                }
              }
            ]
          }
        ],
        roofDetails: {
          type: 'Asphalt Shingle',
          age: 12,
          area: 2200,
          pitch: '6:12'
        }
      };
      
      setAssessment(mockAssessment);
      setIsLoading(false);
    }, 1000);
  };

  const generateCostEstimate = () => {
    if (!isConnected) {
      Alert.alert(
        'Offline Mode',
        'Cost estimation requires an internet connection. Please try again when you are online.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsGeneratingEstimate(true);
    
    // Simulate API call to cost estimator agent
    setTimeout(() => {
      const mockEstimate = {
        id: `estimate_${Date.now()}`,
        assessmentId: assessment.id,
        materialType: 'Asphalt Shingle',
        quality: 'standard',
        region: 'South',
        materialCostMin: 4500,
        materialCostMax: 5500,
        materialCostAvg: 5000,
        laborCostMin: 3500,
        laborCostMax: 4500,
        laborCostAvg: 4000,
        additionalCostsTotal: 1000,
        totalCostMin: 9000,
        totalCostMax: 11000,
        totalCostAvg: 10000,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        notes: 'Estimate based on regional pricing data and damage assessment.',
        lineItems: [
          { description: 'Asphalt Shingles (Standard)', quantity: '22 squares', unitPrice: 125, total: 2750 },
          { description: 'Underlayment', quantity: '22 squares', unitPrice: 45, total: 990 },
          { description: 'Ridge Caps', quantity: '60 linear ft', unitPrice: 12, total: 720 },
          { description: 'Flashing', quantity: '1 set', unitPrice: 540, total: 540 },
          { description: 'Labor - Tear Off', quantity: '22 squares', unitPrice: 55, total: 1210 },
          { description: 'Labor - Installation', quantity: '22 squares', unitPrice: 125, total: 2750 },
          { description: 'Disposal Fees', quantity: '1', unitPrice: 550, total: 550 },
          { description: 'Permits', quantity: '1', unitPrice: 250, total: 250 },
          { description: 'Miscellaneous', quantity: '1', unitPrice: 240, total: 240 }
        ]
      };
      
      setCostEstimate(mockEstimate);
      setIsGeneratingEstimate(false);
    }, 3000);
  };

  const submitAssessment = () => {
    Alert.alert(
      'Submit Assessment',
      'Are you sure you want to submit this assessment? This will finalize the assessment and make it available for claims processing.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: () => {
            // Simulate API call
            setIsLoading(true);
            setTimeout(() => {
              setAssessment({
                ...assessment,
                status: 'completed'
              });
              setIsLoading(false);
              Alert.alert(
                'Assessment Submitted',
                'The assessment has been successfully submitted.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('AssessmentsList')
                  }
                ]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  const createClaim = () => {
    navigation.navigate('ClaimDetail', {
      assessmentId: assessment.id,
      projectId: assessment.projectId,
      costEstimate: costEstimate
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assessment details...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>Assessment not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Assessment Details</Text>
            <Text style={styles.headerSubtitle}>
              {assessment.status === 'draft' ? 'Draft' : assessment.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            style={[
              styles.statusChip,
              assessment.status === 'completed' ? styles.completedChip : 
              assessment.status === 'in_progress' ? styles.inProgressChip : 
              styles.draftChip
            ]}
          >
            {assessment.status === 'draft' ? 'Draft' : 
             assessment.status === 'in_progress' ? 'In Progress' : 
             'Completed'}
          </Chip>
        </View>
      </Surface>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Damage Assessment</Text>
        
        <ScrollView horizontal style={styles.imagesContainer}>
          {assessment.images.map((image, index) => (
            <Card key={`image_${index}`} style={styles.imageCard}>
              <Card.Cover source={{ uri: image.uri }} style={styles.image} />
              <Card.Content>
                <Text style={styles.imageDate}>
                  {new Date(image.timestamp).toLocaleString()}
                </Text>
              </Card.Content>
            </Card>
          ))}
          <Button 
            mode="outlined" 
            icon="camera" 
            style={styles.addImageButton}
            onPress={() => navigation.navigate('Camera', { assessmentId: assessment.id, projectId: assessment.projectId })}
          >
            Add More
          </Button>
        </ScrollView>
        
        <View style={styles.detectedDamageContainer}>
          <Text style={styles.subsectionTitle}>Detected Damage</Text>
          {assessment.damageDetections.length > 0 ? (
            assessment.damageDetections.map((detection, detectionIndex) => (
              <Card key={`detection_${detectionIndex}`} style={styles.damageCard}>
                <Card.Content>
                  <Text style={styles.damageCardTitle}>Image {detectionIndex + 1} Analysis</Text>
                  {detection.damages.map((damage, damageIndex) => (
                    <View key={`damage_${detectionIndex}_${damageIndex}`} style={styles.damageItem}>
                      <View style={styles.damageTypeContainer}>
                        <Icon name="alert-circle" size={20} color={theme.colors.accent} />
                        <Text style={styles.damageType}>{damage.type}</Text>
                      </View>
                      <Text style={styles.damageConfidence}>
                        Confidence: {Math.round(damage.confidence * 100)}%
                      </Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noDamageText}>No damage detected yet</Text>
          )}
        </View>
        
        <View style={styles.voiceNotesContainer}>
          <Text style={styles.subsectionTitle}>Voice Notes</Text>
          {assessment.voiceNotes.length > 0 ? (
            assessment.voiceNotes.map((note, index) => (
              <Card key={`note_${index}`} style={styles.noteCard}>
                <Card.Content>
                  <View style={styles.noteHeader}>
                    <Icon name="microphone" size={20} color={theme.colors.primary} />
                    <Text style={styles.noteDate}>
                      {new Date(note.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.noteText}>{note.text}</Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noNotesText}>No voice notes recorded</Text>
          )}
          <Button 
            mode="outlined" 
            icon="microphone" 
            style={styles.addNoteButton}
            onPress={() => navigation.navigate('Camera', { assessmentId: assessment.id, projectId: assessment.projectId })}
          >
            Add Voice Note
          </Button>
        </View>
        
        {assessment.roofDetails && (
          <View style={styles.roofDetailsContainer}>
            <Text style={styles.subsectionTitle}>Roof Details</Text>
            <Card style={styles.roofDetailsCard}>
              <Card.Content>
                <View style={styles.roofDetailItem}>
                  <Text style={styles.roofDetailLabel}>Type:</Text>
                  <Text style={styles.roofDetailValue}>{assessment.roofDetails.type}</Text>
                </View>
                <View style={styles.roofDetailItem}>
                  <Text style={styles.roofDetailLabel}>Age:</Text>
                  <Text style={styles.roofDetailValue}>{assessment.roofDetails.age} years</Text>
                </View>
                <View style={styles.roofDetailItem}>
                  <Text style={styles.roofDetailLabel}>Area:</Text>
                  <Text style={styles.roofDetailValue}>{assessment.roofDetails.area} sq ft</Text>
                </View>
                <View style={styles.roofDetailItem}>
                  <Text style={styles.roofDetailLabel}>Pitch:</Text>
                  <Text style={styles.roofDetailValue}>{assessment.roofDetails.pitch}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>
      
      <Divider style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cost Estimate</Text>
        
        {costEstimate ? (
          <View>
            <Card style={styles.estimateCard}>
              <Card.Content>
                <View style={styles.estimateSummary}>
                  <View style={styles.estimateRange}>
                    <Text style={styles.estimateRangeLabel}>Estimated Cost Range:</Text>
                    <Text style={styles.estimateRangeValue}>
                      ${costEstimate.totalCostMin.toLocaleString()} - ${costEstimate.totalCostMax.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.estimateAverage}>
                    <Text style={styles.estimateAverageLabel}>Average Cost:</Text>
                    <Text style={styles.estimateAverageValue}>
                      ${costEstimate.totalCostAvg.toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <Divider style={styles.estimateDivider} />
                
                <Text style={styles.lineItemsTitle}>Estimate Details:</Text>
                {costEstimate.lineItems.map((item, index) => (
                  <View key={`item_${index}`} style={styles.lineItem}>
                    <View style={styles.lineItemDetails}>
                      <Text style={styles.lineItemDescription}>{item.description}</Text>
                      <Text style={styles.lineItemQuantity}>{item.quantity}</Text>
                    </View>
                    <View style={styles.lineItemPricing}>
                      <Text style={styles.lineItemUnitPrice}>${item.unitPrice}</Text>
                      <Text style={styles.lineItemTotal}>${item.total.toLocaleString()}</Text>
                    </View>
                  </View>
                ))}
                
                <Divider style={styles.estimateDivider} />
                
                <View style={styles.estimateNotes}>
                  <Text style={styles.estimateNotesLabel}>Notes:</Text>
                  <Text style={styles.estimateNotesText}>{costEstimate.notes}</Text>
                </View>
              </Card.Content>
            </Card>
            
            <Button 
              mode="contained" 
              icon="file-document" 
              style={styles.createClaimButton}
              onPress={createClaim}
            >
              Create Insurance Claim
            </Button>
          </View>
        ) : (
          <View style={styles.noEstimateContainer}>
            <Text style={styles.noEstimateText}>
              No cost estimate generated yet. Generate an estimate to proceed with insurance claims.
            </Text>
            <Button 
              mode="contained" 
              icon="calculator" 
              style={styles.generateEstimateButton}
              onPress={generateCostEstimate}
              loading={isGeneratingEstimate}
              disabled={isGeneratingEstimate || !isConnected}
            >
              {isGeneratingEstimate ? 'Generating Estimate...' : 'Generate Cost Estimate'}
            </Button>
            {!isConnected && (
              <Text style={styles.offlineWarning}>
                Cost estimation requires an internet connection
              </Text>
            )}
          </View>
   
(Content truncated due to size limit. Use line ranges to read in chunks)