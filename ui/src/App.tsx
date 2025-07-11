import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, TextField, InputLabel, Stack, CircularProgress } from '@mui/material';

const steps = [
  'Upload/Define PMS Spec',
  'AI Mapping Suggestions',
  'Manual Mapping',
  'Generate/Preview Files',
  'Test Translation',
  'Deploy Integration',
];

function getStepContent(
  step: number,
  pmsSpec: string,
  handleSpecChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>) => void,
  mappingSuggestions: string,
  loading: boolean,
  pmsCode: string,
  handlePmsCodeChange: (e: ChangeEvent<HTMLInputElement>) => void,
  pmsName: string,
  handlePmsNameChange: (e: ChangeEvent<HTMLInputElement>) => void
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
          ) : (
            <Paper elevation={1} sx={{ p: 2, background: '#e3f2fd' }}>
              <Typography color="primary">
                {mappingSuggestions || '(Placeholder) Mapping suggestions will be generated here based on your uploaded PMS spec.'}
              </Typography>
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
  const [mappingSuggestions, setMappingSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [pmsCode, setPmsCode] = useState('');
  const [pmsName, setPmsName] = useState('');

  const handleNext = async () => {
    if (activeStep === 0 && pmsSpec && pmsCode && pmsName) {
      setLoading(true);
      setMappingSuggestions('');
      try {
        // Use the entered PMS code for the endpoint
        const response = await fetch(`/pms/${encodeURIComponent(pmsCode)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: pmsSpec,
        });
        const data = await response.text();
        setMappingSuggestions(data);
      } catch (err) {
        setMappingSuggestions('Error contacting backend.');
      } finally {
        setLoading(false);
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
    setMappingSuggestions('');
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
            handlePmsNameChange
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
