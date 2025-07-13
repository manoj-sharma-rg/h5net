import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, TextField, InputLabel, Stack, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const steps = [
  'Upload/Define PMS Spec',
  'AI Mapping Suggestions',
  'Manual Mapping',
  'Generate/Preview Files',
  'Test Translation',
  'Deploy Integration',
];

interface MappingSuggestion {
  pmsField: string;
  rgbridgeField: string;
  confidence: number;
}

function getStepContent(
  step: number,
  pmsSpec: string,
  handleSpecChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void,
  mappingSuggestions: MappingSuggestion[],
  loading: boolean,
  pmsCode: string,
  handlePmsCodeChange: (e: ChangeEvent<HTMLInputElement>) => void,
  pmsName: string,
  handlePmsNameChange: (e: ChangeEvent<HTMLInputElement>) => void,
  mappingMessage: string
) {
  switch (step) {
    case 0:
      return (
        <Stack spacing={2}>
          <Typography>Step 1: Enter PMS details and upload or define the PMS spec (JSON/XML/GraphQL/SOAP).</Typography>
          <TextField
            id="pms-code"
            label="PMS Code"
            value={pmsCode}
            onChange={handlePmsCodeChange}
            variant="outlined"
            required
            fullWidth
            inputProps={{ maxLength: 32 }}
            helperText="Unique code for this PMS (used in gateway URL and as folder name)"
          />
          <TextField
            id="pms-name"
            label="PMS Name"
            value={pmsName}
            onChange={handlePmsNameChange}
            variant="outlined"
            required
            fullWidth
            inputProps={{ maxLength: 64 }}
            helperText="Descriptive name for this PMS"
          />
          <InputLabel htmlFor="pms-spec-file">Upload PMS Spec File</InputLabel>
          <input
            id="pms-spec-file"
            type="file"
            accept=".json,.xml,.graphql,.gql,.wsdl,.txt,.soap,.yml,.yaml"
            onChange={handleFileUpload}
            style={{ marginBottom: 16 }}
          />
          <InputLabel htmlFor="pms-spec-text">Or paste PMS Spec below</InputLabel>
          <TextField
            id="pms-spec-text"
            label="PMS Spec (raw text)"
            multiline
            minRows={6}
            value={pmsSpec}
            onChange={handleSpecChange}
            variant="outlined"
            fullWidth
            placeholder="Paste your PMS spec here (JSON, XML, GraphQL, SOAP, etc.)"
          />
        </Stack>
      );
    case 1:
      return pmsSpec ? (
        <Stack spacing={2}>
          <Typography>Step 2: AI-assisted mapping suggestions will appear here.</Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 80 }}>
              <CircularProgress />
            </Box>
          ) : mappingSuggestions.length > 0 ? (
            <Paper elevation={1} sx={{ p: 2, background: '#e3f2fd' }}>
              <Typography color="primary" sx={{ mb: 2 }}>{mappingMessage}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PMS Field</TableCell>
                      <TableCell>RGBridge Field</TableCell>
                      <TableCell>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mappingSuggestions.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{m.pmsField}</TableCell>
                        <TableCell>{m.rgbridgeField}</TableCell>
                        <TableCell>{(m.confidence * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper elevation={1} sx={{ p: 2, background: '#e3f2fd' }}>
              <Typography color="primary">(Placeholder) Mapping suggestions will be generated here based on your uploaded PMS spec.</Typography>
            </Paper>
          )}
        </Stack>
      ) : (
        <Typography color="error">Please complete Step 1 and provide a PMS spec to see mapping suggestions.</Typography>
      );
    case 2:
      return <Typography>Step 3: Manual mapping for unclear fields (AI suggestions + user input).</Typography>;
    case 3:
      return <Typography>Step 4: Generate and preview translator/mapping files.</Typography>;
    case 4:
      return <Typography>Step 5: Test translation with sample payloads.</Typography>;
    case 5:
      return (
        <Stack spacing={2}>
          <Typography>Step 6: Deploy new PMS integration (creates folder, registers plugin).</Typography>
          <Paper elevation={1} sx={{ p: 2, background: '#e1f5fe' }}>
            <Typography color="info.main">(Placeholder) Deploy your new PMS integration to the platform. This will create the necessary folder and register the plugin.</Typography>
            <Box sx={{ mt: 2 }}>
              <Button variant="contained" color="primary" disabled>
                Deploy Integration (Coming Soon)
              </Button>
            </Box>
          </Paper>
        </Stack>
      );
    default:
      return <Typography>Unknown step</Typography>;
  }
}

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [pmsSpec, setPmsSpec] = useState('');
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestion[]>([]);
  const [mappingMessage, setMappingMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pmsCode, setPmsCode] = useState('');
  const [pmsName, setPmsName] = useState('');

  const handleNext = async () => {
    if (activeStep === 0 && pmsSpec && pmsCode && pmsName) {
      console.log('Starting PMS onboarding process:', { pmsCode, pmsName, specLength: pmsSpec.length });
      setLoading(true);
      setMappingSuggestions([]);
      setMappingMessage('');
      try {
        const url = `http://localhost:8000/mappings/${encodeURIComponent(pmsCode)}`;
        console.log('Making API request to:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'X-PMS-Name': pmsName,
          },
          body: pmsSpec,
        });
        
        console.log('API response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API request failed:', errorText);
          throw new Error(errorText);
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        setMappingSuggestions(data.mappings || []);
        setMappingMessage(data.message || 'Mapping suggestions generated.');
        console.log('Successfully processed mapping suggestions:', data.mappings?.length || 0);
      } catch (err: any) {
        console.error('Error during PMS onboarding:', err);
        setMappingSuggestions([]);
        setMappingMessage('Error contacting backend: ' + (err?.message || err));
      } finally {
        setLoading(false);
        console.log('PMS onboarding process completed');
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setPmsSpec('');
    setMappingSuggestions([]);
    setMappingMessage('');
    setPmsCode('');
    setPmsName('');
  };

  const handleSpecChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPmsSpec(e.target.value);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPmsSpec(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handlePmsCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPmsCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''));
  };

  const handlePmsNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPmsName(e.target.value);
  };

  const canProceed = activeStep !== 0 || (pmsSpec && pmsCode && pmsName && !loading);

  return (
    <Box sx={{ width: '100%', p: 4, background: '#f5f7fa', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ maxWidth: 800, margin: 'auto', p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom color="primary">
          PMS Integration Onboarding Wizard
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ minHeight: 120, mb: 2 }}>
          {getStepContent(
            activeStep,
            pmsSpec,
            handleSpecChange,
            handleFileUpload,
            mappingSuggestions,
            loading,
            pmsCode,
            handlePmsCodeChange,
            pmsName,
            handlePmsNameChange,
            mappingMessage
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === steps.length ? (
            <Button onClick={handleReset} variant="contained" color="primary">
              Reset
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained" color="primary" disabled={!canProceed}>
              {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default App;
