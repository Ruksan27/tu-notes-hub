import fs from 'fs';

async function fetchNvidiaModels() {
  const apiKey = process.env.NVIDIA_API_KEY || 'nvapi-rD2T9YwI99wL_v1vO38U0v1T_L2TzE5U1w5U_J8T1kP1L8P1L1K5I8N5v9T';
  
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      const modelIds = data.data.map(m => m.id);
      fs.writeFileSync('nvidia_models.json', JSON.stringify(modelIds, null, 2));
      console.log('Saved models to nvidia_models.json');
    } else {
      console.error('Failed to fetch:', res.status, await res.text());
    }
  } catch (e) {
    console.error(e);
  }
}

fetchNvidiaModels();
