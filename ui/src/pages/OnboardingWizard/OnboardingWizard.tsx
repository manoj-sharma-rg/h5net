import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Collapse,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Upload as UploadIcon,
  Preview as PreviewIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
  approved: boolean;
}

const OnboardingWizard: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [pmsCode, setPmsCode] = useState('');
  const [pmsSpec, setPmsSpec] = useState('');
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestion[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    specInput: true,
    mappingReview: true,
    filePreview: false,
  });

  const steps = [
    'PMS Specification Upload',
    'AI Mapping & Review',
    'File Generation Preview',
    'Test Translation',
    'Deploy Integration',
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      // Generate mapping suggestions
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/mappings/${pmsCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pmsSpec }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setMappingSuggestions(data.mappingSuggestions || []);
          setGeneratedFiles(data.generatedFiles || []);
        }
      } catch (error) {
        console.error('Error generating mappings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleMappingApproval = (index: number, approved: boolean) => {
    setMappingSuggestions(prev => 
      prev.map((mapping, i) => 
        i === index ? { ...mapping, approved } : mapping
      )
    );
  };

  const handleTestTranslation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/pms/${pmsCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedData: 'Sample PMS feed data for testing',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(data.translatedData || 'Translation completed successfully');
      }
    } catch (error) {
      setTestResult('Error during translation: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                PMS Specification Upload
              </Typography>
              <IconButton onClick={() => toggleSection('specInput')}>
                {expandedSections.specInput ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.specInput}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>PMS Code</InputLabel>
                <Select
                  value={pmsCode}
                  label="PMS Code"
                  onChange={(e) => setPmsCode(e.target.value)}
                >
                  <MenuItem value="hotelabc">HotelABC</MenuItem>
                  <MenuItem value="resortxyz">ResortXYZ</MenuItem>
                  <MenuItem value="motel123">Motel123</MenuItem>
                  <MenuItem value="inn456">Inn456</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={8}
                label="PMS Specification (JSON)"
                value={pmsSpec}
                onChange={(e) => setPmsSpec(e.target.value)}
                placeholder="Paste your PMS specification JSON here..."
                variant="outlined"
              />
            </Collapse>
          </Paper>
        );

      case 1:
        return (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                AI Mapping Suggestions & Manual Review
              </Typography>
              <IconButton onClick={() => toggleSection('mappingReview')}>
                {expandedSections.mappingReview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.mappingReview}>
              {mappingSuggestions.length > 0 ? (
                <Box>
                  {mappingSuggestions.map((mapping, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">
                              {mapping.sourceField} → {mapping.targetField}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Confidence: {mapping.confidence}%
                            </Typography>
                          </Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={mapping.approved}
                                onChange={(e) => handleMappingApproval(index, e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Approve"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No mapping suggestions available. Please complete step 1 first.
                </Typography>
              )}
            </Collapse>
          </Paper>
        );

      case 2:
        return (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Generated Files Preview
              </Typography>
              <IconButton onClick={() => toggleSection('filePreview')}>
                {expandedSections.filePreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.filePreview}>
              {generatedFiles.length > 0 ? (
                <Box>
                  {generatedFiles.map((file, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {file}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Generated configuration file for {pmsCode}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No files generated yet. Please complete previous steps first.
                </Typography>
              )}
            </Collapse>
          </Paper>
        );

      case 3:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Test Translation
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleTestTranslation}
              disabled={isLoading}
              sx={{ mb: 2 }}
            >
              {isLoading ? <CircularProgress size={20} /> : 'Test Translation'}
            </Button>
            
            {testResult && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {testResult}
                </Typography>
              </Alert>
            )}
          </Paper>
        );

      case 4:
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deploy Integration
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body1">
                Integration for {pmsCode} is ready for deployment!
              </Typography>
            </Alert>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              size="large"
            >
              Deploy Integration
            </Button>
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        PMS Integration Onboarding Wizard
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={activeStep === steps.length - 1}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default OnboardingWizard; 