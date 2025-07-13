import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Total PMS Integrations', value: '12', icon: <CheckCircleIcon color="success" /> },
    { title: 'Active Integrations', value: '10', icon: <TrendingUpIcon color="primary" /> },
    { title: 'Pending Onboarding', value: '2', icon: <ScheduleIcon color="warning" /> },
    { title: 'Issues Detected', value: '1', icon: <WarningIcon color="error" /> },
  ];

  const recentActivity = [
    { action: 'PMS "HotelABC" integration completed', time: '2 hours ago', status: 'success' },
    { action: 'PMS "ResortXYZ" onboarding started', time: '1 day ago', status: 'pending' },
    { action: 'Translation error detected in PMS "Motel123"', time: '2 days ago', status: 'error' },
    { action: 'PMS "Inn456" mapping updated', time: '3 days ago', status: 'success' },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Button
          component={Link}
          to="/onboard"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ mr: 2 }}
        >
          Onboard New PMS
        </Button>
        <Button variant="outlined" startIcon={<CheckCircleIcon />}>
          View All Integrations
        </Button>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  {stat.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    {activity.status === 'success' && <CheckCircleIcon color="success" />}
                    {activity.status === 'pending' && <ScheduleIcon color="warning" />}
                    {activity.status === 'error' && <WarningIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.action}
                    secondary={activity.time}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                API Status
              </Typography>
              <Typography variant="body1" color="success.main">
                ● All systems operational
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Last Backup
              </Typography>
              <Typography variant="body1">
                2 hours ago
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Uptime
              </Typography>
              <Typography variant="body1">
                99.9% (last 30 days)
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 