import React, { useState, useEffect } from 'react';
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
  const [pmsName, setPmsName] = useState('');
  const [pmsSpec, setPmsSpec] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestion[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
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

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += `Page ${pageNum}:\n${pageText}\n\n`;
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      if (file.type === 'application/pdf') {
        setIsPdfExtracting(true);
        try {
          const extractedText = await extractPdfText(file);
          setPmsSpec(extractedText);
        } catch (error) {
          setPmsSpec(`Error extracting PDF text: ${error}\n\nFile: ${file.name}`);
        } finally {
          setIsPdfExtracting(false);
        }
      } else {
        // For text files (JSON, TXT), read the content
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setPmsSpec(content);
        };
        reader.readAsText(file);
      }
    }
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
            <Typography variant="h5" gutterBottom>
              PMS Specification Upload
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                sx={{ flex: 1 }}
                label="PMS Code"
                value={pmsCode}
                onChange={(e) => setPmsCode(e.target.value)}
                placeholder="Enter PMS code (e.g., hotelabc, resortxyz)"
                variant="outlined"
                helperText="Use lowercase letters, numbers, dash, and underscore only"
              />
              
              <TextField
                sx={{ flex: 1 }}
                label="PMS Name"
                value={pmsName}
                onChange={(e) => setPmsName(e.target.value)}
                placeholder="Enter PMS name (e.g., My Hotel PMS)"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload PMS Specification File
              </Typography>
                                                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={isPdfExtracting}
                    sx={{ mr: 2 }}
                  >
                    {isPdfExtracting ? 'Extracting PDF...' : 'Upload File'}
                    <input
                      type="file"
                      hidden
                      accept=".json,.txt,.pdf"
                      onChange={handleFileUpload}
                    />
                  </Button>
                  {isPdfExtracting && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="primary">
                        Extracting text from PDF...
                      </Typography>
                    </Box>
                  )}
                  {uploadedFile && !isPdfExtracting && (
                    <Typography variant="body2" color="success.main">
                      ✓ {uploadedFile.name} uploaded
                      {uploadedFile.type === 'application/pdf' && ' (text extracted)'}
                    </Typography>
                  )}
            </Box>
            
                          <TextField
                fullWidth
                multiline
                rows={8}
                label="PMS Specification"
                value={pmsSpec}
                onChange={(e) => setPmsSpec(e.target.value)}
                placeholder="Paste your PMS specification here or upload a file above..."
                variant="outlined"
                helperText="You can either paste specification directly or upload a JSON, TXT, or PDF file"
              />
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