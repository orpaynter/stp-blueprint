import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Chip, Divider, ActivityIndicator, Surface, TextInput } from 'react-native-paper';
import { useOffline } from '../../contexts/OfflineContext';
import { theme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Yup from 'yup';
import { Formik } from 'formik';

const ClaimDetailScreen = ({ navigation, route }) => {
  const { claimId, assessmentId, projectId, costEstimate } = route.params || {};
  const { isConnected, queueClaim } = useOffline();
  const [claim, setClaim] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fraudScore, setFraudScore] = useState(null);

  useEffect(() => {
    // Fetch claim details or use passed data
    if (claimId) {
      fetchClaimDetails();
    } else if (assessmentId) {
      // Create a new claim from assessment data
      const newClaim = {
        id: `temp_${Date.now()}`,
        assessmentId: assessmentId,
        projectId: projectId,
        status: 'draft',
        costEstimate: costEstimate,
        createdAt: new Date().toISOString(),
      };
      setClaim(newClaim);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [claimId, assessmentId, projectId]);

  const fetchClaimDetails = async () => {
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      const mockClaim = {
        id: claimId,
        assessmentId: assessmentId,
        projectId: projectId,
        status: 'draft',
        policyNumber: 'POL-2023-45678',
        insuranceCompany: 'Reliable Insurance Co.',
        adjusterName: 'John Smith',
        adjusterEmail: 'john.smith@reliableins.com',
        adjusterPhone: '(555) 123-4567',
        incidentDate: '2023-04-05',
        incidentType: 'Hail Damage',
        incidentDescription: 'Severe hail storm caused significant damage to roof shingles and gutters.',
        policyStartDate: '2022-01-01',
        policyEndDate: '2023-01-01',
        deductible: 1000,
        coverageLimit: 25000,
        claimAmount: costEstimate ? costEstimate.totalCostAvg : 10000,
        createdAt: '2023-04-10T15:30:00Z',
        documents: [
          {
            id: 'doc_1',
            type: 'Policy Document',
            filename: 'policy_document.pdf',
            uploadedAt: '2023-04-10T15:35:00Z'
          },
          {
            id: 'doc_2',
            type: 'Damage Photos',
            filename: 'damage_photos.zip',
            uploadedAt: '2023-04-10T15:40:00Z'
          }
        ]
      };
      
      setClaim(mockClaim);
      setIsLoading(false);
    }, 1000);
  };

  const validateClaim = async (values) => {
    if (!isConnected) {
      Alert.alert(
        'Offline Mode',
        'Fraud validation requires an internet connection. The claim will be queued for submission when you are back online.',
        [{ text: 'OK' }]
      );
      return true;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call to fraud detector agent
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockFraudScore = {
          score: 0.12,
          riskLevel: 'low',
          suspiciousPatterns: [],
          recommendation: 'Proceed with claim submission. No suspicious patterns detected.'
        };
        
        setFraudScore(mockFraudScore);
        setIsSubmitting(false);
        
        if (mockFraudScore.score < 0.3) {
          resolve(true); // Low risk, proceed
        } else if (mockFraudScore.score < 0.7) {
          Alert.alert(
            'Medium Fraud Risk',
            'This claim has some suspicious patterns. Do you want to proceed with submission?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Proceed',
                onPress: () => resolve(true)
              }
            ]
          );
        } else {
          Alert.alert(
            'High Fraud Risk',
            'This claim has been flagged for high fraud risk. Please review the claim details before submission.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Proceed Anyway',
                onPress: () => resolve(true)
              }
            ]
          );
        }
      }, 2000);
    });
  };

  const submitClaim = async (values) => {
    const isValid = await validateClaim(values);
    
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Update claim with form values
    const updatedClaim = {
      ...claim,
      ...values,
      status: 'submitted',
      submittedDate: new Date().toISOString()
    };
    
    if (!isConnected) {
      // Queue claim for later submission
      await queueClaim(updatedClaim);
      setIsSubmitting(false);
      
      Alert.alert(
        'Claim Queued',
        'Your claim has been saved and will be submitted when you are back online.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ClaimsList')
          }
        ]
      );
    } else {
      // Simulate API call
      setTimeout(() => {
        setClaim(updatedClaim);
        setIsSubmitting(false);
        
        Alert.alert(
          'Claim Submitted',
          'Your claim has been successfully submitted for processing.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ClaimsList')
            }
          ]
        );
      }, 1500);
    }
  };

  const validationSchema = Yup.object().shape({
    policyNumber: Yup.string().required('Policy number is required'),
    insuranceCompany: Yup.string().required('Insurance company is required'),
    incidentDate: Yup.string().required('Incident date is required'),
    incidentType: Yup.string().required('Incident type is required'),
    incidentDescription: Yup.string().required('Incident description is required'),
    deductible: Yup.number().required('Deductible amount is required'),
    claimAmount: Yup.number().required('Claim amount is required')
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading claim details...</Text>
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>Claim not found</Text>
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
            <Text style={styles.headerTitle}>Insurance Claim</Text>
            <Text style={styles.headerSubtitle}>
              {claim.status === 'draft' ? 'Draft' : 
               claim.status === 'submitted' ? 'Submitted' : 
               claim.status === 'approved' ? 'Approved' : 
               claim.status === 'denied' ? 'Denied' : 
               claim.status}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            style={[
              styles.statusChip,
              claim.status === 'approved' ? styles.approvedChip : 
              claim.status === 'denied' ? styles.deniedChip : 
              claim.status === 'submitted' ? styles.submittedChip : 
              styles.draftChip
            ]}
          >
            {claim.status === 'draft' ? 'Draft' : 
             claim.status === 'submitted' ? 'Submitted' : 
             claim.status === 'approved' ? 'Approved' : 
             claim.status === 'denied' ? 'Denied' : 
             claim.status}
          </Chip>
        </View>
      </Surface>

      <Formik
        initialValues={{
          policyNumber: claim.policyNumber || '',
          insuranceCompany: claim.insuranceCompany || '',
          adjusterName: claim.adjusterName || '',
          adjusterEmail: claim.adjusterEmail || '',
          adjusterPhone: claim.adjusterPhone || '',
          incidentDate: claim.incidentDate || '',
          incidentType: claim.incidentType || '',
          incidentDescription: claim.incidentDescription || '',
          policyStartDate: claim.policyStartDate || '',
          policyEndDate: claim.policyEndDate || '',
          deductible: claim.deductible ? claim.deductible.toString() : '',
          coverageLimit: claim.coverageLimit ? claim.coverageLimit.toString() : '',
          claimAmount: claim.claimAmount ? claim.claimAmount.toString() : ''
        }}
        validationSchema={validationSchema}
        onSubmit={submitClaim}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Policy Information</Text>
                
                <TextInput
                  label="Policy Number"
                  value={values.policyNumber}
                  onChangeText={handleChange('policyNumber')}
                  onBlur={handleBlur('policyNumber')}
                  error={touched.policyNumber && errors.policyNumber}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                {touched.policyNumber && errors.policyNumber && (
                  <Text style={styles.errorText}>{errors.policyNumber}</Text>
                )}
                
                <TextInput
                  label="Insurance Company"
                  value={values.insuranceCompany}
                  onChangeText={handleChange('insuranceCompany')}
                  onBlur={handleBlur('insuranceCompany')}
                  error={touched.insuranceCompany && errors.insuranceCompany}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                {touched.insuranceCompany && errors.insuranceCompany && (
                  <Text style={styles.errorText}>{errors.insuranceCompany}</Text>
                )}
                
                <TextInput
                  label="Policy Start Date (YYYY-MM-DD)"
                  value={values.policyStartDate}
                  onChangeText={handleChange('policyStartDate')}
                  onBlur={handleBlur('policyStartDate')}
                  error={touched.policyStartDate && errors.policyStartDate}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                
                <TextInput
                  label="Policy End Date (YYYY-MM-DD)"
                  value={values.policyEndDate}
                  onChangeText={handleChange('policyEndDate')}
                  onBlur={handleBlur('policyEndDate')}
                  error={touched.policyEndDate && errors.policyEndDate}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                
                <TextInput
                  label="Deductible Amount ($)"
                  value={values.deductible}
                  onChangeText={handleChange('deductible')}
                  onBlur={handleBlur('deductible')}
                  error={touched.deductible && errors.deductible}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  disabled={claim.status !== 'draft'}
                />
                {touched.deductible && errors.deductible && (
                  <Text style={styles.errorText}>{errors.deductible}</Text>
                )}
                
                <TextInput
                  label="Coverage Limit ($)"
                  value={values.coverageLimit}
                  onChangeText={handleChange('coverageLimit')}
                  onBlur={handleBlur('coverageLimit')}
                  error={touched.coverageLimit && errors.coverageLimit}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="numeric"
                  disabled={claim.status !== 'draft'}
                />
              </Card.Content>
            </Card>
            
            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Adjuster Information</Text>
                
                <TextInput
                  label="Adjuster Name"
                  value={values.adjusterName}
                  onChangeText={handleChange('adjusterName')}
                  onBlur={handleBlur('adjusterName')}
                  error={touched.adjusterName && errors.adjusterName}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                
                <TextInput
                  label="Adjuster Email"
                  value={values.adjusterEmail}
                  onChangeText={handleChange('adjusterEmail')}
                  onBlur={handleBlur('adjusterEmail')}
                  error={touched.adjusterEmail && errors.adjusterEmail}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  disabled={claim.status !== 'draft'}
                />
                
                <TextInput
                  label="Adjuster Phone"
                  value={values.adjusterPhone}
                  onChangeText={handleChange('adjusterPhone')}
                  onBlur={handleBlur('adjusterPhone')}
                  error={touched.adjusterPhone && errors.adjusterPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                  disabled={claim.status !== 'draft'}
                />
              </Card.Content>
            </Card>
            
            <Card style={styles.formCard}>
              <Card.Content>
                <Text style={styles.sectionTitle}>Incident Information</Text>
                
                <TextInput
                  label="Incident Date (YYYY-MM-DD)"
                  value={values.incidentDate}
                  onChangeText={handleChange('incidentDate')}
                  onBlur={handleBlur('incidentDate')}
                  error={touched.incidentDate && errors.incidentDate}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                {touched.incidentDate && errors.incidentDate && (
                  <Text style={styles.errorText}>{errors.incidentDate}</Text>
                )}
                
                <TextInput
                  label="Incident Type"
                  value={values.incidentType}
                  onChangeText={handleChange('incidentType')}
                  onBlur={handleBlur('incidentType')}
                  error={touched.incidentType && errors.incidentType}
                  style={styles.input}
                  mode="outlined"
                  disabled={claim.status !== 'draft'}
                />
                {touched.incidentType && errors.incidentType && (
                  <Text style={st
(Content truncated due to size limit. Use line ranges to read in chunks)