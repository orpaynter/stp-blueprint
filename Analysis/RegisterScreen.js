import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, Checkbox } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../config/theme';
import * as Yup from 'yup';
import { Formik } from 'formik';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [error, setError] = useState(null);

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    email: Yup.string()
      .email('Please enter a valid email')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    role: Yup.string()
      .oneOf(['homeowner', 'contractor', 'supplier', 'insurance_agent'], 'Please select a valid role')
      .required('Role is required'),
    agreeToTerms: Yup.boolean()
      .oneOf([true], 'You must agree to the terms and conditions')
  });

  const handleRegister = async (values) => {
    setIsLoading(true);
    setError(null);
    
    // Remove confirmPassword from the data sent to API
    const { confirmPassword, agreeToTerms, ...userData } = values;
    
    const result = await register(userData);
    setIsLoading(false);
    
    if (result.success) {
      navigation.navigate('Login');
    } else {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Surface style={styles.surface}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join OrPaynter today</Text>
          
          {error && (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          )}
          
          <Formik
            initialValues={{ 
              firstName: '', 
              lastName: '', 
              email: '', 
              password: '', 
              confirmPassword: '', 
              role: 'homeowner',
              agreeToTerms: false
            }}
            validationSchema={validationSchema}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
              <View style={styles.form}>
                <TextInput
                  label="First Name"
                  value={values.firstName}
                  onChangeText={handleChange('firstName')}
                  onBlur={handleBlur('firstName')}
                  error={touched.firstName && errors.firstName}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                />
                {touched.firstName && errors.firstName && (
                  <HelperText type="error">{errors.firstName}</HelperText>
                )}
                
                <TextInput
                  label="Last Name"
                  value={values.lastName}
                  onChangeText={handleChange('lastName')}
                  onBlur={handleBlur('lastName')}
                  error={touched.lastName && errors.lastName}
                  style={styles.input}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                />
                {touched.lastName && errors.lastName && (
                  <HelperText type="error">{errors.lastName}</HelperText>
                )}
                
                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  error={touched.email && errors.email}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email" />}
                />
                {touched.email && errors.email && (
                  <HelperText type="error">{errors.email}</HelperText>
                )}
                
                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={touched.password && errors.password}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry={secureTextEntry}
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={secureTextEntry ? "eye" : "eye-off"}
                      onPress={() => setSecureTextEntry(!secureTextEntry)}
                    />
                  }
                />
                {touched.password && errors.password && (
                  <HelperText type="error">{errors.password}</HelperText>
                )}
                
                <TextInput
                  label="Confirm Password"
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={touched.confirmPassword && errors.confirmPassword}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry={confirmSecureTextEntry}
                  left={<TextInput.Icon icon="lock-check" />}
                  right={
                    <TextInput.Icon
                      icon={confirmSecureTextEntry ? "eye" : "eye-off"}
                      onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                    />
                  }
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <HelperText type="error">{errors.confirmPassword}</HelperText>
                )}
                
                <Text style={styles.roleLabel}>I am a:</Text>
                <View style={styles.roleContainer}>
                  <Button
                    mode={values.role === 'homeowner' ? 'contained' : 'outlined'}
                    onPress={() => setFieldValue('role', 'homeowner')}
                    style={styles.roleButton}
                  >
                    Homeowner
                  </Button>
                  <Button
                    mode={values.role === 'contractor' ? 'contained' : 'outlined'}
                    onPress={() => setFieldValue('role', 'contractor')}
                    style={styles.roleButton}
                  >
                    Contractor
                  </Button>
                </View>
                <View style={styles.roleContainer}>
                  <Button
                    mode={values.role === 'supplier' ? 'contained' : 'outlined'}
                    onPress={() => setFieldValue('role', 'supplier')}
                    style={styles.roleButton}
                  >
                    Supplier
                  </Button>
                  <Button
                    mode={values.role === 'insurance_agent' ? 'contained' : 'outlined'}
                    onPress={() => setFieldValue('role', 'insurance_agent')}
                    style={styles.roleButton}
                  >
                    Insurance Agent
                  </Button>
                </View>
                {touched.role && errors.role && (
                  <HelperText type="error">{errors.role}</HelperText>
                )}
                
                <View style={styles.termsContainer}>
                  <Checkbox
                    status={values.agreeToTerms ? 'checked' : 'unchecked'}
                    onPress={() => setFieldValue('agreeToTerms', !values.agreeToTerms)}
                  />
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => {/* Navigate to Terms */}}
                    >
                      Terms and Conditions
                    </Text>
                    {' '}and{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => {/* Navigate to Privacy Policy */}}
                    >
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
                {touched.agreeToTerms && errors.agreeToTerms && (
                  <HelperText type="error">{errors.agreeToTerms}</HelperText>
                )}
                
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={styles.button}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  Create Account
                </Button>
              </View>
            )}
          </Formik>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.loginButton}
            >
              Sign In
            </Button>
          </View>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  roleLabel: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
    color: theme.colors.text,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  termsText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: theme.colors.text,
  },
  loginButton: {
    marginLeft: 5,
  },
});

export default RegisterScreen;
