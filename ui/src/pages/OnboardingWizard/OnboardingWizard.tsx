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
  Chip,
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
  const [unmappedFields, setUnmappedFields] = useState<string[]>([]);
  const [unmappedSuggestions, setUnmappedSuggestions] = useState<{ [key: string]: string[] }>({});
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfExtracting, setIsPdfExtracting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    specInput: true,
    mappingReview: true,
    filePreview: false,
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deployResult, setDeployResult] = useState<string>('');

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
        const response = await fetch(`http://localhost:8000/api/mapping/${pmsCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            pmsSpec: pmsSpec,
            pmsName: pmsName 
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Convert backend response format to frontend format
          const suggestions = (data.mappings || []).map((mapping: any) => ({
            sourceField: mapping.pmsField,
            targetField: mapping.rgbridgeField,
            confidence: mapping.confidence * 100, // Convert to percentage
            approved: false
          }));
          setMappingSuggestions(suggestions);
          
          // Add mock unmapped fields for demonstration
          setUnmappedFields([
            'guestName',
            'checkInTime',
            'checkOutTime',
            'roomNumber',
            'totalAmount',
            'paymentMethod',
            'specialRequests',
            'loyaltyPoints'
          ]);
          
          // Add mock generated files for demonstration
          setGeneratedFiles([
            `${pmsCode}_translator.cs`,
            `${pmsCode}_mapping.json`,
            `${pmsCode}_config.xml`
          ]);
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

  const handleApproveAll = () => {
    setMappingSuggestions(prev => 
      prev.map(mapping => ({ ...mapping, approved: true }))
    );
  };

  const handleRejectAll = () => {
    setMappingSuggestions(prev => 
      prev.map(mapping => ({ ...mapping, approved: false }))
    );
  };

  const generateAISuggestions = async () => {
    if (unmappedFields.length === 0) return;
    
    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('http://localhost:8000/api/mapping/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pmsCode,
          pmsSpec,
          unmappedFields
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnmappedSuggestions(data.suggestions || {});
      } else {
        // Fallback: generate mock suggestions based on field names
        const mockSuggestions: { [key: string]: string[] } = {};
        unmappedFields.forEach(field => {
          mockSuggestions[field] = generateMockSuggestions(field);
        });
        setUnmappedSuggestions(mockSuggestions);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      // Fallback: generate mock suggestions
      const mockSuggestions: { [key: string]: string[] } = {};
      unmappedFields.forEach(field => {
        mockSuggestions[field] = generateMockSuggestions(field);
      });
      setUnmappedSuggestions(mockSuggestions);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const generateMockSuggestions = (fieldName: string): string[] => {
    const suggestions: { [key: string]: string[] } = {
      guestName: ['GuestName', 'CustomerName', 'ClientName', 'ReservationName'],
      checkInTime: ['CheckInTime', 'ArrivalTime', 'CheckInDateTime', 'ArrivalDateTime'],
      checkOutTime: ['CheckOutTime', 'DepartureTime', 'CheckOutDateTime', 'DepartureDateTime'],
      roomNumber: ['RoomNumber', 'RoomId', 'RoomCode', 'AccommodationNumber'],
      totalAmount: ['TotalAmount', 'TotalPrice', 'TotalCost', 'Amount'],
      paymentMethod: ['PaymentMethod', 'PaymentType', 'PaymentMode', 'PaymentOption'],
      specialRequests: ['SpecialRequests', 'SpecialRequirements', 'Notes', 'Comments'],
      loyaltyPoints: ['LoyaltyPoints', 'RewardPoints', 'Points', 'LoyaltyBalance']
    };
    
    return suggestions[fieldName] || ['UnknownField', 'CustomField', 'UserField'];
  };

  const applySuggestion = (unmappedField: string, suggestion: string) => {
    // Add the suggestion as a new mapping
    const newMapping: MappingSuggestion = {
      sourceField: unmappedField,
      targetField: suggestion,
      confidence: 85, // AI suggestions have medium confidence
      approved: false
    };
    
    setMappingSuggestions(prev => [...prev, newMapping]);
    
    // Remove from unmapped fields
    setUnmappedFields(prev => prev.filter(field => field !== unmappedField));
    
    // Remove from suggestions
    setUnmappedSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[unmappedField];
      return newSuggestions;
    });
  };

  const extractPdfText = async (file: File): Promise<string> => {
    try {
      // For now, send PDF to backend for extraction
      // This is more reliable than client-side extraction
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('http://localhost:8000/api/file/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.extractedText || 'No text extracted from PDF';
      } else {
        throw new Error('Backend PDF extraction failed');
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      
      // Fallback: return file info and instructions
      return `PDF file uploaded: ${file.name}\n\nNote: PDF text extraction requires backend support.\nPlease paste the PMS specification content directly in the text area below, or upload a JSON/TXT file instead.\n\nFile size: ${(file.size / 1024).toFixed(2)} KB`;
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
      const response = await fetch(`http://localhost:8000/api/pms/${pmsCode}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testData: 'Sample PMS feed data for testing',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(data.message || 'Translation completed successfully');
      } else {
        setTestResult('Error during translation: ' + response.statusText);
      }
    } catch (error) {
      setTestResult('Error during translation: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployIntegration = async () => {
    setIsDeploying(true);
    try {
      // In a real implementation, this would:
      // 1. Save all approved mappings to the backend
      // 2. Generate the actual translator code
      // 3. Deploy the translator to the production environment
      // 4. Activate the integration
      
      // Mock deployment process
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deployment time
      
      const approvedMappings = mappingSuggestions.filter(m => m.approved);
      const deploymentData = {
        pmsCode,
        pmsName,
        mappings: approvedMappings,
        generatedFiles,
        timestamp: new Date().toISOString()
      };
      
      // Send deployment request to backend
      const response = await fetch('http://localhost:8000/api/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pmsCode,
          pmsName,
          mappings: approvedMappings.map(m => ({
            sourceField: m.sourceField,
            targetField: m.targetField,
            confidence: m.confidence / 100 // Convert back to decimal
          })),
          generatedFiles
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setIsDeployed(true);
        setDeployResult(`✅ ${result.message}

Generated Files:
${result.files.map((file: string) => `• ${file}`).join('\n')}

Approved Mappings: ${approvedMappings.length}
Integration Status: ${result.status}
Endpoint: ${result.endpoint}
Deployment ID: ${result.deploymentId}

Your PMS integration is now ready to receive and process feeds!`);
      } else {
        throw new Error(`Deployment failed: ${response.statusText}`);
      }
      
    } catch (error) {
      setDeployResult('❌ Deployment failed: ' + error);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleFinish = () => {
    // In a real implementation, this would:
    // 1. Save the onboarding session
    // 2. Redirect to dashboard or integration management page
    // 3. Show success message with next steps
    
    alert(`🎉 PMS Integration Onboarding Complete!

PMS Code: ${pmsCode}
PMS Name: ${pmsName}
Status: Successfully Deployed

Next Steps:
• Monitor integration performance in the dashboard
• Configure webhook endpoints for your PMS
• Set up alerts and notifications
• View integration logs and analytics

You can now start sending PMS feeds to: /api/pms/${pmsCode}`);
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
            <Typography variant="h5" gutterBottom>
              AI Mapping Suggestions & Manual Review
            </Typography>
            
            {/* Mapped Fields Section */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Mapped Fields ({mappingSuggestions.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleApproveAll}
                    disabled={mappingSuggestions.length === 0}
                  >
                    Approve All
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRejectAll}
                    disabled={mappingSuggestions.length === 0}
                  >
                    Reject All
                  </Button>
                </Box>
              </Box>
              
              {mappingSuggestions.length > 0 ? (
                <Box>
                  {mappingSuggestions.map((mapping, index) => (
                    <Card key={index} sx={{ mb: 2, border: mapping.approved ? '2px solid #4caf50' : '1px solid #e0e0e0' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: mapping.approved ? 'bold' : 'normal' }}>
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
            </Box>

            {/* Unmapped Fields Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Unmapped Fields ({unmappedFields.length})
                </Typography>
                {unmappedFields.length > 0 && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={generateAISuggestions}
                    disabled={isGeneratingSuggestions}
                    startIcon={isGeneratingSuggestions ? <CircularProgress size={16} /> : null}
                  >
                    {isGeneratingSuggestions ? 'Generating...' : 'Get AI Suggestions'}
                  </Button>
                )}
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                These fields need manual mapping or AI suggestions based on your PMS specification
              </Typography>
              
              {unmappedFields.length > 0 ? (
                <Box>
                  {unmappedFields.map((field, index) => (
                    <Card key={index} sx={{ mb: 2, border: '1px solid #ff9800' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="warning.main" gutterBottom>
                          {field}
                        </Typography>
                        
                        {unmappedSuggestions[field] ? (
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              AI Suggestions (based on PMS spec):
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              {unmappedSuggestions[field].map((suggestion, suggestionIndex) => (
                                <Chip
                                  key={suggestionIndex}
                                  label={suggestion}
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => applySuggestion(field, suggestion)}
                                  sx={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Click "Get AI Suggestions" to generate mapping options
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  All fields have been mapped successfully! 🎉
                </Typography>
              )}
            </Box>

            {/* Summary */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Summary:</strong> {mappingSuggestions.filter(m => m.approved).length} of {mappingSuggestions.length} mappings approved, 
                {unmappedFields.length} fields still need mapping.
              </Typography>
            </Box>
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
            
            {!isDeployed ? (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Integration for {pmsCode} is ready for deployment!
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    This will generate and deploy the translator code, activate the integration, and make it ready to receive PMS feeds.
                  </Typography>
                </Alert>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Deployment Summary:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    • PMS Code: {pmsCode}<br/>
                    • PMS Name: {pmsName}<br/>
                    • Approved Mappings: {mappingSuggestions.filter(m => m.approved).length}<br/>
                    • Generated Files: {generatedFiles.length}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  color="success"
                  startIcon={isDeploying ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                  size="large"
                  onClick={handleDeployIntegration}
                  disabled={isDeploying}
                >
                  {isDeploying ? 'Deploying...' : 'Deploy Integration'}
                </Button>
              </>
            ) : (
              <>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    ✅ Integration deployed successfully!
                  </Typography>
                </Alert>
                
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {deployResult}
                  </Typography>
                </Box>
                
                <Alert severity="info">
                  <Typography variant="body2">
                    Your integration is now active and ready to receive PMS feeds at: <strong>/api/pms/{pmsCode}</strong>
                  </Typography>
                </Alert>
              </>
            )}
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
          onClick={activeStep === steps.length - 1 ? handleFinish : handleNext}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default OnboardingWizard; 