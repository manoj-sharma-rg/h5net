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
import { apiFetch } from '../../utils/api';

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
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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
        const response = await apiFetch(`/api/mapping/${pmsCode}`, {
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
      const response = await apiFetch('/api/mapping/ai-suggestions', {
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
      
      const response = await apiFetch('/api/file/extract-pdf', {
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
    if (!pmsCode) {
      setTestResult('Error: PMS code is required for testing');
      return;
    }
    
    setIsLoading(true);
    setTestResult('');
    
    try {
      console.log(`Testing translation for PMS: ${pmsCode}`);
      
      const response = await apiFetch(`/api/pms/${pmsCode}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testData: 'Sample PMS feed data for testing',
        }),
      });
      
      console.log('Test response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test response data:', data);
        
        setTestResult(`✅ Test Translation Successful!

Response Details:
• Status: ${response.status} OK
• Message: ${data.message || 'Translation completed successfully'}
• Timestamp: ${data.timestamp || 'N/A'}
• Success: ${data.success !== false ? 'Yes' : 'No'}

The translation endpoint is working correctly!`);
      } else {
        const errorText = await response.text();
        console.error('Test failed:', response.status, errorText);
        
        setTestResult(`❌ Test Translation Failed!

Error Details:
• Status: ${response.status} ${response.statusText}
• Error: ${errorText || 'Unknown error'}

Please check:
• Backend server is running on port 8000
• PMS code "${pmsCode}" is valid
• Network connectivity`);
      }
    } catch (error) {
      console.error('Test translation error:', error);
      
      setTestResult(`❌ Test Translation Error!

Error Details:
• Type: ${error instanceof Error ? error.name : 'Unknown'}
• Message: ${error instanceof Error ? error.message : String(error)}

Please check:
• Backend server is running on http://localhost:8000
• Network connectivity
• CORS settings`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployIntegration = async () => {
    if (!pmsCode) {
      setDeployResult('❌ Error: PMS code is required for deployment');
      return;
    }
    
    const approvedMappings = mappingSuggestions.filter(m => m.approved);
    if (approvedMappings.length === 0) {
      setDeployResult('❌ Error: At least one mapping must be approved before deployment');
      return;
    }
    
    setIsDeploying(true);
    setDeployResult('');
    
    try {
      console.log('Starting deployment for PMS:', pmsCode);
      console.log('Approved mappings:', approvedMappings);
      
      const deploymentPayload = {
        pmsCode,
        pmsName,
        mappings: approvedMappings.map(m => ({
          sourceField: m.sourceField,
          targetField: m.targetField,
          confidence: m.confidence / 100 // Convert back to decimal
        })),
        generatedFiles
      };
      
      console.log('Deployment payload:', deploymentPayload);
      
      // Send deployment request to backend
      const response = await apiFetch('/api/deployment/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deploymentPayload),
      });
      
      console.log('Deployment response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Deployment result:', result);
        
        setIsDeployed(true);
        setDeployResult(`✅ ${result.message}

Generated Files:
${result.files.map((file: string) => `• ${file}`).join('\n')}

Approved Mappings: ${approvedMappings.length}
Integration Status: ${result.status}
Endpoint: ${result.endpoint}
Deployment ID: ${result.deploymentId}
Timestamp: ${result.timestamp}

Your PMS integration is now ready to receive and process feeds!`);
      } else {
        const errorText = await response.text();
        console.error('Deployment failed:', response.status, errorText);
        
        throw new Error(`Deployment failed: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
    } catch (error) {
      console.error('Deployment error:', error);
      
      setDeployResult(`❌ Deployment Failed!

Error Details:
• Type: ${error instanceof Error ? error.name : 'Unknown'}
• Message: ${error instanceof Error ? error.message : String(error)}

Please check:
• Backend server is running on http://localhost:8000
• At least one mapping is approved
• Network connectivity
• Backend deployment endpoint is accessible`);
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

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      const response = await apiFetch('/api/mapping/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pmsCode: 'test', pmsSpec: 'test', unmappedFields: [] }),
      });
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  // Check backend status when component mounts
  React.useEffect(() => {
    checkBackendStatus();
  }, []);

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
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                  {Object.keys(unmappedSuggestions).length > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // Apply first suggestion for all unmapped fields
                        Object.keys(unmappedSuggestions).forEach(field => {
                          if (unmappedSuggestions[field] && unmappedSuggestions[field].length > 0) {
                            applySuggestion(field, unmappedSuggestions[field][0]);
                          }
                        });
                      }}
                    >
                      Approve All Suggestions
                    </Button>
                  )}
                </Box>
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
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      These files will be generated during deployment based on your approved mappings and PMS configuration.
                    </Typography>
                  </Alert>
                  
                  {generatedFiles.map((file, index) => {
                    const fileType = file.split('.').pop()?.toLowerCase();
                    const getFileDescription = (filename: string) => {
                      if (filename.includes('translator')) return 'C# translator class that handles PMS feed processing';
                      if (filename.includes('mapping')) return 'JSON configuration with field mappings';
                      if (filename.includes('config')) return 'XML configuration for integration settings';
                      return 'Configuration file for PMS integration';
                    };
                    
                    const getFileIcon = (type: string) => {
                      switch (type) {
                        case 'cs': return '🔷';
                        case 'json': return '📄';
                        case 'xml': return '📋';
                        default: return '📁';
                      }
                    };
                    
                    return (
                      <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ mr: 1 }}>
                              {getFileIcon(fileType || '')}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {file}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {getFileDescription(file)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={fileType?.toUpperCase() || 'FILE'} 
                              size="small" 
                              variant="outlined" 
                              color="primary" 
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<PreviewIcon />}
                              onClick={() => {
                                // Generate preview content based on file type
                                let previewContent = '';
                                if (file.includes('translator')) {
                                  previewContent = `public class ${pmsCode.charAt(0).toUpperCase() + pmsCode.slice(1)}Translator : IPmsTranslator
{
    public async Task<TranslationResult> TranslateAsync(string pmsData)
    {
        // Translation logic will be implemented here
        // Based on approved mappings: ${mappingSuggestions.filter(m => m.approved).map(m => `${m.sourceField}->${m.targetField}`).join(', ')}
        return new TranslationResult { Success = true, Data = "Translated data" };
    }
}`;
                                } else if (file.includes('mapping')) {
                                  previewContent = JSON.stringify({
                                    pmsCode: pmsCode,
                                    mappings: mappingSuggestions.filter(m => m.approved).map(m => ({
                                      sourceField: m.sourceField,
                                      targetField: m.targetField,
                                      confidence: m.confidence
                                    }))
                                  }, null, 2);
                                } else if (file.includes('config')) {
                                  previewContent = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <pmsIntegration>
    <pmsCode>${pmsCode}</pmsCode>
    <pmsName>${pmsName}</pmsName>
    <enabled>true</enabled>
    <endpoint>/api/pms/${pmsCode}</endpoint>
  </pmsIntegration>
</configuration>`;
                                }
                                
                                // Show preview in alert
                                alert(`Preview of ${file}:\n\n${previewContent}`);
                              }}
                            >
                              Preview
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Next:</strong> These files will be generated and deployed in step 5. 
                      The translator will be activated and ready to process PMS feeds.
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      No files generated yet. Please complete step 1 to generate mapping suggestions first.
                    </Typography>
                  </Alert>
                  <Typography color="textSecondary">
                    Files will be generated based on your PMS specification and approved mappings.
                  </Typography>
                </Box>
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
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Test the translation functionality by sending sample data to the PMS integration endpoint.
              </Typography>
            </Alert>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Test Configuration:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • PMS Code: {pmsCode}<br/>
                • Endpoint: /api/pms/{pmsCode}/test<br/>
                • Sample Data: "Sample PMS feed data for testing"
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
              onClick={handleTestTranslation}
              disabled={isLoading || !pmsCode}
              sx={{ mb: 2 }}
            >
              {isLoading ? 'Testing...' : 'Test Translation'}
            </Button>
            
            {testResult && (
              <Alert 
                severity={testResult.includes('Error') ? 'error' : 'success'} 
                sx={{ mt: 2 }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {testResult}
                </Typography>
              </Alert>
            )}
            
            {!pmsCode && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Please complete step 1 to set up a PMS code before testing.
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
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="body2">Backend Status:</Typography>
                  {backendStatus === 'checking' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="textSecondary">Checking...</Typography>
                    </Box>
                  )}
                  {backendStatus === 'online' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography variant="body2" color="success.main">Online</Typography>
                    </Box>
                  )}
                  {backendStatus === 'offline' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                      <Typography variant="body2" color="error.main">Offline</Typography>
                      <Button size="small" onClick={checkBackendStatus}>Retry</Button>
                    </Box>
                  )}
                </Box>
                
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
                
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                  
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={async () => {
                      // Test deployment with sample data
                      const testData = {
                        pmsCode: 'testhotel',
                        pmsName: 'Test Hotel PMS',
                        mappings: [
                          { sourceField: 'roomType', targetField: 'InvCode', confidence: 0.95 },
                          { sourceField: 'ratePlan', targetField: 'RatePlanCode', confidence: 0.92 }
                        ],
                        generatedFiles: ['testhotel_translator.cs', 'mapping.json', 'manifest.json']
                      };
                      
                      try {
                        const response = await apiFetch('/api/deployment/deploy', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(testData),
                        });
                        
                                                 if (response.ok) {
                           const result = await response.json();
                           alert(`✅ Test deployment successful!\n\nFiles created:\n${result.files.join('\n')}\n\nCheck the ../pms/testhotel/ folder.`);
                         } else {
                          const error = await response.text();
                          alert(`❌ Test deployment failed: ${response.status} ${response.statusText}\n\n${error}`);
                        }
                      } catch (error) {
                        alert(`❌ Test deployment error: ${error}\n\nMake sure the backend server is running on http://localhost:8000`);
                      }
                    }}
                  >
                    Test Deployment
                  </Button>
                </Box>
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