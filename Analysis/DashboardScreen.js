import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Surface, ActivityIndicator, Chip, Avatar, Card, Title, Paragraph } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';
import { theme } from '../../config/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isConnected } = useOffline();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    projects: {
      total: 12,
      pending: 3,
      inProgress: 7,
      completed: 2
    },
    assessments: {
      total: 18,
      pending: 5,
      completed: 13
    },
    claims: {
      total: 8,
      pending: 3,
      approved: 4,
      denied: 1
    },
    payments: {
      total: 15,
      pending: 2,
      completed: 13
    }
  });

  // Simulated data for recent activities
  const recentActivities = [
    {
      id: '1',
      type: 'assessment',
      title: 'New Roof Assessment',
      description: 'Assessment #A-2023-042 has been completed',
      date: '2 hours ago',
      icon: 'home-roof'
    },
    {
      id: '2',
      type: 'claim',
      title: 'Claim Approved',
      description: 'Insurance claim #C-2023-018 has been approved',
      date: '1 day ago',
      icon: 'check-circle'
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payment Received',
      description: 'Payment of $2,450.00 has been processed',
      date: '2 days ago',
      icon: 'credit-card'
    }
  ];

  // Simulated data for upcoming schedules
  const upcomingSchedules = [
    {
      id: '1',
      title: 'Roof Inspection',
      address: '123 Main St, Austin, TX',
      date: 'Tomorrow, 10:00 AM',
      weatherDependent: true,
      weather: {
        condition: 'Sunny',
        temperature: '75°F',
        precipitation: '0%'
      }
    },
    {
      id: '2',
      title: 'Material Delivery',
      address: '456 Oak Ave, Austin, TX',
      date: 'Apr 15, 8:30 AM',
      weatherDependent: false
    }
  ];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleSpecificActions = () => {
    switch (user?.role) {
      case 'homeowner':
        return [
          { title: 'Request Assessment', icon: 'home-roof', onPress: () => navigation.navigate('Assessments') },
          { title: 'View Projects', icon: 'clipboard-list', onPress: () => navigation.navigate('Projects') },
          { title: 'Submit Claim', icon: 'file-document', onPress: () => navigation.navigate('Claims') },
          { title: 'Make Payment', icon: 'credit-card', onPress: () => navigation.navigate('Payments') }
        ];
      case 'contractor':
        return [
          { title: 'New Assessment', icon: 'camera', onPress: () => navigation.navigate('Camera') },
          { title: 'View Projects', icon: 'clipboard-list', onPress: () => navigation.navigate('Projects') },
          { title: 'Schedule Work', icon: 'calendar', onPress: () => {} },
          { title: 'Order Materials', icon: 'shopping', onPress: () => navigation.navigate('Marketplace') }
        ];
      case 'supplier':
        return [
          { title: 'View Orders', icon: 'package-variant', onPress: () => {} },
          { title: 'Manage Inventory', icon: 'warehouse', onPress: () => {} },
          { title: 'Process Shipment', icon: 'truck-delivery', onPress: () => {} },
          { title: 'View Payments', icon: 'credit-card', onPress: () => navigation.navigate('Payments') }
        ];
      case 'insurance_agent':
        return [
          { title: 'Review Claims', icon: 'file-document', onPress: () => navigation.navigate('Claims') },
          { title: 'View Assessments', icon: 'home-roof', onPress: () => navigation.navigate('Assessments') },
          { title: 'Process Payments', icon: 'credit-card', onPress: () => navigation.navigate('Payments') },
          { title: 'Fraud Detection', icon: 'shield-alert', onPress: () => {} }
        ];
      default:
        return [
          { title: 'View Projects', icon: 'clipboard-list', onPress: () => navigation.navigate('Projects') },
          { title: 'View Assessments', icon: 'home-roof', onPress: () => navigation.navigate('Assessments') },
          { title: 'View Claims', icon: 'file-document', onPress: () => navigation.navigate('Claims') },
          { title: 'View Payments', icon: 'credit-card', onPress: () => navigation.navigate('Payments') }
        ];
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>{getWelcomeMessage()},</Text>
            <Text style={styles.nameText}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.connectionStatus}>
            {isConnected ? (
              <Chip icon="wifi" mode="outlined" style={styles.onlineChip}>Online</Chip>
            ) : (
              <Chip icon="wifi-off" mode="outlined" style={styles.offlineChip}>Offline</Chip>
            )}
          </View>
        </View>
      </Surface>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {getRoleSpecificActions().map((action, index) => (
            <Surface key={index} style={styles.actionCard}>
              <Button
                mode="contained"
                icon={action.icon}
                onPress={action.onPress}
                style={styles.actionButton}
                contentStyle={styles.actionButtonContent}
              >
                {action.title}
              </Button>
            </Surface>
          ))}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="clipboard-list" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statTitle}>Projects</Text>
            <Text style={styles.statValue}>{stats.projects.total}</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetail}>
                <Text style={styles.statHighlight}>{stats.projects.inProgress}</Text> in progress
              </Text>
            </View>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="home-roof" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statTitle}>Assessments</Text>
            <Text style={styles.statValue}>{stats.assessments.total}</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetail}>
                <Text style={styles.statHighlight}>{stats.assessments.pending}</Text> pending
              </Text>
            </View>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="file-document" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statTitle}>Claims</Text>
            <Text style={styles.statValue}>{stats.claims.total}</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetail}>
                <Text style={styles.statHighlight}>{stats.claims.approved}</Text> approved
              </Text>
            </View>
          </Surface>

          <Surface style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="credit-card" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statTitle}>Payments</Text>
            <Text style={styles.statValue}>{stats.payments.total}</Text>
            <View style={styles.statDetails}>
              <Text style={styles.statDetail}>
                <Text style={styles.statHighlight}>{stats.payments.pending}</Text> pending
              </Text>
            </View>
          </Surface>
        </View>
      </View>

      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivities.map(activity => (
          <Card key={activity.id} style={styles.activityCard}>
            <Card.Content style={styles.activityCardContent}>
              <Avatar.Icon 
                size={40} 
                icon={activity.icon} 
                style={styles.activityIcon} 
                color="white" 
              />
              <View style={styles.activityDetails}>
                <Title style={styles.activityTitle}>{activity.title}</Title>
                <Paragraph style={styles.activityDescription}>{activity.description}</Paragraph>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {(user?.role === 'contractor' || user?.role === 'homeowner') && (
        <View style={styles.schedulesContainer}>
          <Text style={styles.sectionTitle}>Upcoming Schedule</Text>
          {upcomingSchedules.map(schedule => (
            <Card key={schedule.id} style={styles.scheduleCard}>
              <Card.Content>
                <View style={styles.scheduleHeader}>
                  <Title style={styles.scheduleTitle}>{schedule.title}</Title>
                  {schedule.weatherDependent && (
                    <Chip 
                      icon={schedule.weather.condition === 'Sunny' ? 'weather-sunny' : 'weather-rainy'} 
                      style={styles.weatherChip}
                    >
                      {schedule.weather.temperature}
                    </Chip>
                  )}
                </View>
                <Paragraph style={styles.scheduleAddress}>{schedule.address}</Paragraph>
                <Text style={styles.scheduleDate}>{schedule.date}</Text>
                {schedule.weatherDependent && (
                  <Text style={styles.scheduleWeather}>
                    Weather: {schedule.weather.condition}, Precipitation: {schedule.weather.precipitation}
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button>View Details</Button>
                <Button>Navigate</Button>
              </Card.Actions>
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'white',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionStatus: {
    alignItems: 'flex-end',
  },
  onlineChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  offlineChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
  },
  actionButton: {
    borderRadius: 0,
    height: 100,
    justifyContent: 'center',
  },
  actionButtonContent: {
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: theme.colors.text,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: 5,
  },
  statDetails: {
    marginTop: 5,
  },
  statDetail: {
    fontSize: 12,
    color: theme.colors.text,
  },
  statHighlight: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
  recentActivityContainer: {
    padding: 20,
  },
  activityCard: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  activityCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    backgroundColor: theme.colors.primary,
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activityDate: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 5,
  },
  schedulesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  scheduleCard: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  weatherChip: {
    backgroundColor: theme.colors.accent,
  },
  scheduleAddress: {
    fontSize: 14,
    color: theme.colors.text,
  },
  scheduleDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 5,
  },
  scheduleWeather: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 5,
  },
});

export default DashboardScreen;
