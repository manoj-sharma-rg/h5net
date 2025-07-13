import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface PMSSystem {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  recordsProcessed: number;
  errors: number;
  version: string;
}

const IntegratedPMS: React.FC = () => {
  const [selectedPMS, setSelectedPMS] = useState<PMSSystem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const pmsSystems: PMSSystem[] = [
    {
      id: '1',
      name: 'HotelABC',
      code: 'hotelabc',
      status: 'active',
      lastSync: '2024-01-15 14:30:00',
      recordsProcessed: 1250,
      errors: 0,
      version: '1.2.3',
    },
    {
      id: '2',
      name: 'ResortXYZ',
      code: 'resortxyz',
      status: 'active',
      lastSync: '2024-01-15 13:45:00',
      recordsProcessed: 890,
      errors: 2,
      version: '1.1.0',
    },
    {
      id: '3',
      name: 'Motel123',
      code: 'motel123',
      status: 'error',
      lastSync: '2024-01-15 10:15:00',
      recordsProcessed: 0,
      errors: 15,
      version: '1.0.5',
    },
    {
      id: '4',
      name: 'Inn456',
      code: 'inn456',
      status: 'inactive',
      lastSync: '2024-01-14 18:20:00',
      recordsProcessed: 450,
      errors: 0,
      version: '1.3.1',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ActiveIcon color="success" />;
      case 'inactive':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <WarningIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (pms: PMSSystem) => {
    setSelectedPMS(pms);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Integrated PMS Systems
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PMS Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell>Records Processed</TableCell>
              <TableCell>Errors</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pmsSystems.map((pms) => (
              <TableRow key={pms.id}>
                <TableCell>
                  <Typography variant="subtitle1">{pms.name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={pms.code} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(pms.status)}
                    <Chip
                      label={pms.status}
                      color={getStatusColor(pms.status) as any}
                      size="small"
                    />
                  </Box>
                </TableCell>
                <TableCell>{pms.lastSync}</TableCell>
                <TableCell>{pms.recordsProcessed.toLocaleString()}</TableCell>
                <TableCell>
                  <Typography
                    color={pms.errors > 0 ? 'error' : 'success'}
                  >
                    {pms.errors}
                  </Typography>
                </TableCell>
                <TableCell>{pms.version}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(pms)}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PMS Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          PMS Details - {selectedPMS?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPMS && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  PMS Code
                </Typography>
                <Typography variant="body1">{selectedPMS.code}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(selectedPMS.status)}
                  <Chip
                    label={selectedPMS.status}
                    color={getStatusColor(selectedPMS.status) as any}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Last Sync
                </Typography>
                <Typography variant="body1">{selectedPMS.lastSync}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Version
                </Typography>
                <Typography variant="body1">{selectedPMS.version}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Records Processed
                </Typography>
                <Typography variant="body1">{selectedPMS.recordsProcessed.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Errors
                </Typography>
                <Typography variant="body1" color={selectedPMS.errors > 0 ? 'error' : 'success'}>
                  {selectedPMS.errors}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="primary">
            Edit Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegratedPMS; 