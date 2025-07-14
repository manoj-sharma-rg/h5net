import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
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
  code: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastSync: string;
  recordsProcessed: number;
  errors: number;
  version: string;
}

const IntegratedPMS: React.FC = () => {
  const [selectedPMS, setSelectedPMS] = useState<PMSSystem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pmsSystems, setPmsSystems] = useState<PMSSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('http://localhost:8000/api/pms/integrated')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPmsSystems(data);
        setLoading(false);
      })
      .catch(err => {
        setError(`Failed to load PMS integrations: ${err}`);
        setLoading(false);
      });
  }, []);

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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
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
                <TableRow key={pms.code}>
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
                  <TableCell>{pms.recordsProcessed?.toLocaleString?.() ?? pms.recordsProcessed}</TableCell>
                  <TableCell>
                    <Typography color={pms.errors > 0 ? 'error' : 'success'}>
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
      )}
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
                <Typography variant="body1">{selectedPMS.recordsProcessed?.toLocaleString?.() ?? selectedPMS.recordsProcessed}</Typography>
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