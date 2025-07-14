import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';

// Default config fallback
const DEFAULT_RGBRIDGE_URL = 'https://rgbridge.example.com/api/endpoint';

const FeedTest: React.FC = () => {
  // For now, only one PMS code 'a', but structure for future
  const [pmsCodes, setPmsCodes] = useState<string[]>(['a']);
  const [pmsCode, setPmsCode] = useState('a');
  const [feed, setFeed] = useState('');
  const [translatedFeed, setTranslatedFeed] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [rgbridgeUrl, setRgbridgeUrl] = useState(DEFAULT_RGBRIDGE_URL);
  const [pushResult, setPushResult] = useState('');
  const [isPushing, setIsPushing] = useState(false);

  // Load config.json for RGBridge endpoint
  useEffect(() => {
    fetch('/config.json')
      .then(res => res.json())
      .then(cfg => {
        if (cfg && cfg.rgbridgeEndpoint) setRgbridgeUrl(cfg.rgbridgeEndpoint);
      })
      .catch(() => setRgbridgeUrl(DEFAULT_RGBRIDGE_URL));
  }, []);

  // In future, fetch PMS codes from backend or /pms folder
  // useEffect(() => { ... }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFeed(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleTranslate = async () => {
    setIsTranslating(true);
    setTranslateError('');
    setTranslatedFeed('');
    setPushResult('');
    try {
      const response = await fetch(`http://localhost:8000/api/pms/${pmsCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedData: feed }),
      });
      if (response.ok) {
        const data = await response.json();
        setTranslatedFeed(data.translatedData || JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        setTranslateError(`Error: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (err) {
      setTranslateError(`Error: ${err}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePushToRgbridge = async () => {
    setIsPushing(true);
    setPushResult('');
    try {
      const response = await fetch(rgbridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml, application/json' },
        body: translatedFeed,
      });
      if (response.ok) {
        const text = await response.text();
        setPushResult(`✅ Successfully pushed to RGBridge API.\nResponse: ${text}`);
      } else {
        const errorText = await response.text();
        setPushResult(`❌ Error: ${response.status} ${response.statusText}\n${errorText}`);
      }
    } catch (err) {
      setPushResult(`❌ Error: ${err}`);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Feed Test
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Select PMS Code
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="pms-code-label">PMS Code</InputLabel>
          <Select
            labelId="pms-code-label"
            value={pmsCode}
            label="PMS Code"
            onChange={e => setPmsCode(e.target.value)}
          >
            {pmsCodes.map(code => (
              <MenuItem key={code} value={code}>{code}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {pmsCodes.length === 1 && (
          <Alert severity="info" sx={{ mb: 2 }}>Only one PMS code available. Add more PMS integrations to see more options.</Alert>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          2. Paste or Upload PMS Feed (XML or JSON)
        </Typography>
        <TextField
          label="PMS Feed"
          value={feed}
          onChange={e => setFeed(e.target.value)}
          placeholder="Paste XML or JSON feed here..."
          multiline
          minRows={6}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mb: 2 }}
        >
          Upload File
          <input type="file" hidden accept=".xml,.json,.txt" onChange={handleFileUpload} />
        </Button>
        <Divider sx={{ my: 2 }} />
        <Button
          variant="contained"
          onClick={handleTranslate}
          disabled={!pmsCode || !feed || isTranslating}
        >
          {isTranslating ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          Translate Feed
        </Button>
        {translateError && (
          <Alert severity="error" sx={{ mt: 2 }}>{translateError}</Alert>
        )}
      </Paper>
      {translatedFeed && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            3. Translated Feed
          </Typography>
          <TextField
            label="Translated Feed"
            value={translatedFeed}
            multiline
            minRows={6}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            4. Push to RGBridge API
          </Typography>
          <TextField
            label="RGBridge API Endpoint"
            value={rgbridgeUrl}
            fullWidth
            sx={{ mb: 2 }}
            InputProps={{ readOnly: true }}
          />
          <Button
            variant="contained"
            color="secondary"
            endIcon={<SendIcon />}
            onClick={handlePushToRgbridge}
            disabled={!rgbridgeUrl || isPushing}
          >
            {isPushing ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            Push to RGBridge
          </Button>
          {pushResult && (
            <Alert severity={pushResult.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pushResult}</pre>
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FeedTest; 