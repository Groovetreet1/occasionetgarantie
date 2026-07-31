const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_VISION_MODEL = process.env.HF_VISION_MODEL || 'openai/clip-vit-base-patch32';

const CONDITION_LABELS = [
  'un smartphone en parfait etat, comme neuf',
  'un smartphone en tres bon etat avec quelques traces d usage',
  'un smartphone avec des rayures visibles sur le corps',
  'un smartphone avec un ecran casse ou fissure',
  'un smartphone ancien tres use et abime',
];

const LABEL_FACTORS = [
  { state: 'comme_neuf', factor: 0.93 },
  { state: 'tres_bon', factor: 0.83 },
  { state: 'bon', factor: 0.7 },
  { state: 'acceptable', factor: 0.55 },
  { state: 'acceptable', factor: 0.5 },
];

async function analyzeCondition(imageBuffer) {
  if (!HF_TOKEN) return null;
  try {
    const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_VISION_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
        parameters: { candidate_labels: CONDITION_LABELS },
      }),
    });
    if (!resp.ok) {
      console.error('[HF] analyzeCondition HTTP', resp.status);
      return null;
    }
    const data = await resp.json();
    const top = Array.isArray(data) ? data[0] : data;
    if (!top || typeof top.score !== 'number') return null;
    const idx = CONDITION_LABELS.indexOf(top.label);
    const mapped = LABEL_FACTORS[idx >= 0 ? idx : 1] || LABEL_FACTORS[1];
    return {
      label: top.label,
      score: top.score,
      state: mapped.state,
      factor: mapped.factor,
    };
  } catch (e) {
    console.error('[HF] analyzeCondition error:', e.message);
    return null;
  }
}

module.exports = { analyzeCondition, HF_TOKEN, HF_VISION_MODEL };
