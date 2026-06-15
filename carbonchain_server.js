require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-2-latest';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const HTML_FILE = path.join(__dirname, 'carbonchain_v3.html');

const users = {
  'buyer@demo.com': { id: 'usr_buyer001', email: 'buyer@demo.com', password: 'Demo@1234', full_name: 'Arjun Sharma', role: 'buyer', wallet_address: '0x742d35Cc6634C0532925a3b8D4C9C1C3a6b8F2e1', eth_balance: 5.0, credit_balance: 0 },
  'seller@demo.com': { id: 'usr_sell001', email: 'seller@demo.com', password: 'Demo@1234', full_name: 'GreenEarth Pvt Ltd', role: 'seller', wallet_address: '0x891f24Aa7745D1643936b5d0E8C7D2D4b7c9E3f2', eth_balance: 12.5, credit_balance: 0 },
};

const evidenceVault = {
  p1: { score: 94, label: 'Excellent', sat_dates: ['2024-01', '2024-06', '2024-12'], iot_sensors: 14, auditor: 'Bureau Veritas', standard: 'Verra VCS', ipfs: 'QmXf8zV1b9wKpYrH3cMnP2dTqE7sAjU4iBkRo5vLxNgZ6', gps: '3.4653 S, 62.2159 W', area_ha: 50000, trees_count: 2400000, co2_verified: true, ai_summary: 'Strong reforestation claim with multiple satellite captures, third-party audit support, and high biodiversity indicators.' },
  p2: { score: 91, label: 'Excellent', sat_dates: ['2024-03', '2024-09'], iot_sensors: 8, auditor: 'DNV GL', standard: 'Gold Standard', ipfs: 'QmP3wYqA9mVjBnKcRd7TsE2oFuI5hLxM8gZeN4vCpWtX1', gps: '26.2389 N, 73.0243 E', area_ha: 800, trees_count: 0, co2_verified: true, ai_summary: 'Solar generation claim is consistent with project type, location, vintage, and audit standard.' },
  p3: { score: 89, label: 'Very Good', sat_dates: ['2024-02', '2024-08'], iot_sensors: 22, auditor: 'SCS Global Services', standard: 'Verra VCS', ipfs: 'QmR5tZoB8nWlCkJpVd2UsF3eGvH6iMxQ7fAqS9hKyP4L0', gps: '23.0225 N, 69.6669 E', area_ha: 1200, trees_count: 0, co2_verified: true, ai_summary: 'Wind project has good monitoring density and verified output evidence.' },
  p4: { score: 97, label: 'Excellent', sat_dates: ['2024-01', '2024-04', '2024-07', '2024-10'], iot_sensors: 6, auditor: 'EY Climate Change', standard: 'Gold Standard', ipfs: 'QmS6uApC9oXmDlKqWe3VtG4fHwI7jNyR8gBrT0iLzO5M2', gps: '21.9497 N, 89.1833 E', area_ha: 12000, trees_count: 800000, co2_verified: true, ai_summary: 'Mangrove conservation score is high due to repeated imagery and strong blue-carbon standard fit.' },
  p5: { score: 86, label: 'Very Good', sat_dates: ['2024-05', '2024-11'], iot_sensors: 4, auditor: 'TUV Rheinland', standard: 'CAR', ipfs: 'QmT7vBqD0pYnEmLrXf4WuH5gIxJ8kOzS9hCsU1jMaN6P3', gps: '30.9010 N, 75.8573 E', area_ha: 45, trees_count: 0, co2_verified: true, ai_summary: 'Methane capture evidence is credible, with lower sensor density than larger projects.' },
  p6: { score: 99, label: 'Outstanding', sat_dates: ['2024-02', '2024-05', '2024-08', '2024-11'], iot_sensors: 31, auditor: 'Bureau Veritas', standard: 'Plan Vivo', ipfs: 'QmU8wCrE1qZoFnMsYg5XvI6hJyK9lPaT0iDtV2kBbO7Q4', gps: '9.9312 N, 76.2673 E', area_ha: 2400, trees_count: 0, co2_verified: true, ai_summary: 'Ocean carbon project has exceptional monitoring frequency and sensor coverage.' },
  p7: { score: 72, label: 'Good', sat_dates: ['2024-06'], iot_sensors: 2, auditor: 'Pending', standard: 'Verra VCS', ipfs: 'QmV9xDsF2rApGoNtZh6YwJ7iKzL0mQbU1jEuW3lCcP8R5', gps: '23.2599 N, 77.4126 E', area_ha: 30000, trees_count: 1200000, co2_verified: false, ai_summary: 'Project is plausible but needs more satellite history and final audit evidence before full verification.' },
  p8: { score: 88, label: 'Very Good', sat_dates: ['2024-04', '2024-10'], iot_sensors: 9, auditor: 'SGS', standard: 'ACR', ipfs: 'QmW0yEtG3sBoHpOuAi7ZxK8jLaM1nRcV2kFvX4mDdQ9S6', gps: '13.0827 N, 80.2707 E', area_ha: 15, trees_count: 0, co2_verified: true, ai_summary: 'Energy efficiency listing is consistent and has adequate monitoring for its smaller footprint.' },
};

let projects = [
  { id: 'p1', name: 'Amazon Reforestation Initiative', type: 'REFORESTATION', location: 'Para, Brazil', available_credits: 500, total_credits: 1000, price_per_credit: 0.04, co2_tonnes: 500, verified: true, seller_name: 'GreenEarth Ltd', vintage_year: 2024 },
  { id: 'p2', name: 'Rajasthan Solar Farm', type: 'SOLAR', location: 'Jodhpur, Rajasthan', available_credits: 1200, total_credits: 2000, price_per_credit: 0.03, co2_tonnes: 1200, verified: true, seller_name: 'SolarCo India', vintage_year: 2023 },
  { id: 'p3', name: 'Gujarat Wind Energy Project', type: 'WIND', location: 'Kutch, Gujarat', available_credits: 800, total_credits: 1500, price_per_credit: 0.035, co2_tonnes: 800, verified: true, seller_name: 'WindPower Pvt', vintage_year: 2024 },
  { id: 'p4', name: 'Sundarbans Mangrove Conservation', type: 'REFORESTATION', location: 'West Bengal, India', available_credits: 300, total_credits: 600, price_per_credit: 0.055, co2_tonnes: 300, verified: true, seller_name: 'BlueCarbonIN', vintage_year: 2024 },
  { id: 'p5', name: 'Punjab Methane Capture', type: 'METHANE', location: 'Ludhiana, Punjab', available_credits: 650, total_credits: 800, price_per_credit: 0.042, co2_tonnes: 650, verified: true, seller_name: 'BioGas Punjab', vintage_year: 2023 },
  { id: 'p6', name: 'Kerala Ocean Carbon Project', type: 'OCEAN', location: 'Kochi, Kerala', available_credits: 200, total_credits: 400, price_per_credit: 0.08, co2_tonnes: 200, verified: true, seller_name: 'OceanSink Co', vintage_year: 2024 },
  { id: 'p7', name: 'Madhya Pradesh Forest REDD+', type: 'REFORESTATION', location: 'Bhopal, MP', available_credits: 900, total_credits: 1200, price_per_credit: 0.038, co2_tonnes: 900, verified: false, seller_name: 'ForestIN', vintage_year: 2025 },
  { id: 'p8', name: 'Tamil Nadu Energy Efficiency', type: 'ENERGY_EFFICIENCY', location: 'Chennai, Tamil Nadu', available_credits: 400, total_credits: 600, price_per_credit: 0.028, co2_tonnes: 400, verified: true, seller_name: 'EcoTech TN', vintage_year: 2023 },
];

let ledger = [];
const transactions = [];
const holdings = [];
const watchlist = [];
const sessions = new Map();
const securityEvents = [
  { event_type: 'LOGIN_SUCCESS', ip_address: '103.21.244.1', detail: 'buyer@demo.com authenticated via 2FA', severity: 'INFO', created_at: '2025-04-05T08:22:11' },
  { event_type: 'DOUBLE_COUNT_CHECK', ip_address: 'internal', detail: 'Token CC-0001 ownership verified - single owner confirmed', severity: 'INFO', created_at: '2025-04-05T08:22:12' },
  { event_type: 'SMART_CONTRACT_PAYOUT', ip_address: 'internal', detail: '97.5% seller payout simulated by backend', severity: 'INFO', created_at: '2025-04-05T07:12:55' },
];

seedLedger();

function seedLedger() {
  projects.forEach((project, pi) => {
    for (let i = 0; i < Math.min(project.total_credits - project.available_credits + 3, 8); i++) {
      const retired = i === 5;
      ledger.push({
        id: `CC-${String(pi * 100 + i + 1).padStart(4, '0')}`,
        projectId: project.id,
        projectName: project.name,
        projectType: project.type,
        owner: retired ? 'BURNED' : `0x${crypto.randomBytes(5).toString('hex')}...`,
        status: retired ? 'retired' : 'active',
        vintage: project.vintage_year,
        mintedAt: `2024-${String(Math.min(pi + 1, 9)).padStart(2, '0')}-15`,
        txHash: `0x${crypto.randomBytes(16).toString('hex')}`,
        prevOwners: [project.seller_name],
      });
    }
  });
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function createSession(user) {
  const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
  sessions.set(token, user.email);
  return token;
}

function currentUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const email = sessions.get(token);
  return email ? users[email] : null;
}

function stateFor(user) {
  return {
    user: user ? publicUser(user) : null,
    projects,
    evidenceVault,
    ledger,
    securityEvents,
    transactions: user ? transactions.filter((tx) => tx.buyer_id === user.id || projects.some((p) => (p.seller_id === user.id || p.seller_name === user.full_name) && p.id === tx.project_id)) : [],
    holdings: user ? holdings.filter((h) => h.userId === user.id) : [],
    watchlist: user ? watchlist.filter((w) => w.userId === user.id) : [],
  };
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
  res.end(JSON.stringify(data));
}

function hashId(prefix) {
  return `${prefix}_${crypto.randomBytes(5).toString('hex')}`;
}

function randomTx() {
  return `0x${crypto.randomBytes(32).toString('hex')}`;
}

function fallbackProjectAnalysis(project) {
  const hasGps = Boolean(project.gps);
  const hasStandard = Boolean(project.standard);
  const score = Math.max(58, Math.min(94, 62 + (hasGps ? 10 : 0) + (hasStandard ? 8 : 0) + Math.min(14, Math.floor(project.total_credits / 150)) + (project.description.length > 120 ? 8 : 0)));
  return {
    score,
    label: score >= 90 ? 'Excellent' : score >= 75 ? 'Very Good' : score >= 60 ? 'Good' : 'Needs Review',
    co2_verified: score >= 75,
    ai_summary: `AI review: ${project.type} project looks ${score >= 75 ? 'credible' : 'early-stage'} based on description depth, standard, GPS evidence, and credit volume. Add satellite history and third-party audit files to improve trust.`,
    risks: score >= 75 ? ['Confirm periodic monitoring uploads', 'Attach auditor certificate before large sales'] : ['GPS or audit evidence is incomplete', 'Credit volume needs stronger methodology support'],
  };
}

async function aiJson(system, input, fallback) {
  const providers = [
    process.env.OPENAI_API_KEY && {
      name: 'OpenAI',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      parse: (data) => data.choices?.[0]?.message?.content,
    },
    process.env.GROK_API_KEY && {
      name: 'Grok',
      url: 'https://api.x.ai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: {
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      },
      parse: (data) => data.choices?.[0]?.message?.content,
    },
    process.env.GEMINI_API_KEY && {
      name: 'Gemini',
      url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        system_instruction: {
          parts: [{ text: system }],
        },
        contents: [{
          role: 'user',
          parts: [{ text: JSON.stringify(input) }],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      },
      parse: (data) => data.candidates?.flatMap((candidate) => candidate.content?.parts || []).map((part) => part.text).filter(Boolean).join('\n'),
    },
  ].filter(Boolean);

  if (!providers.length) return { ...fallback, ai_provider: 'Local fallback' };

  const providerErrors = [];
  for (const provider of providers) {
    try {
      const response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.headers,
        body: JSON.stringify(provider.body),
      });
      if (!response.ok) throw new Error(`${provider.name} ${response.status}`);
      const data = await response.json();
      const text = provider.parse(data);
      if (!text) throw new Error(`${provider.name} empty response`);
      return { ...JSON.parse(text), ai_provider: provider.name };
    } catch (error) {
      providerErrors.push(error.message);
      console.warn(`AI provider failed: ${error.message}`);
    }
  }

  console.warn(`Using local AI fallback after provider failures: ${providerErrors.join('; ')}`);
  return { ...fallback, ai_provider: 'Local fallback' };
}

async function analyzeProject(project) {
  const fallback = fallbackProjectAnalysis(project);
  return aiJson(
    'You are a carbon-credit due diligence assistant. Return JSON only with score 0-100, label, co2_verified boolean, ai_summary one sentence, and risks array of short strings.',
    project,
    fallback,
  );
}

async function calculatorAdvice(payload) {
  const fallback = {
    recommendation: `AI recommendation: offset ${payload.credits} credits now, prioritize verified reforestation or renewable projects, and reduce recurring emissions from flights, driving, and electricity first.`,
  };
  return aiJson(
    'You are a concise carbon offset advisor. Return JSON only with recommendation as one practical sentence.',
    payload,
    fallback,
  );
}

async function routeApi(req, res, pathname) {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const user = currentUser(req);

  if (req.method === 'GET' && pathname === '/api/state') return send(res, 200, stateFor(user));

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const body = await parseBody(req);
    const found = users[String(body.email || '').toLowerCase()];
    if (!found || found.password !== body.password) return send(res, 401, { error: 'Invalid email or password' });
    const token = createSession(found);
    securityEvents.unshift({ event_type: 'LOGIN_SUCCESS', ip_address: req.socket.remoteAddress || 'local', detail: `${found.email} authenticated`, severity: 'INFO', created_at: new Date().toISOString() });
    return send(res, 200, { token, user: publicUser(found), state: stateFor(found) });
  }

  if (req.method === 'POST' && pathname === '/api/auth/register') {
    const body = await parseBody(req);
    const email = String(body.email || '').toLowerCase();
    if (!email || !body.password || !body.full_name) return send(res, 400, { error: 'Missing required fields' });
    if (users[email]) return send(res, 409, { error: 'Email already registered' });
    const newUser = { id: hashId('usr'), email, password: body.password, full_name: body.full_name, role: body.role === 'seller' ? 'seller' : 'buyer', wallet_address: body.wallet_address || null, eth_balance: body.role === 'seller' ? 12.5 : 5.0, credit_balance: 0 };
    users[email] = newUser;
    const token = createSession(newUser);
    return send(res, 201, { token, user: publicUser(newUser), state: stateFor(newUser) });
  }

  if (!user && !['/api/ai/calculator'].includes(pathname)) return send(res, 401, { error: 'Sign in required' });

  if (req.method === 'POST' && pathname === '/api/projects') {
    if (user.role !== 'seller') return send(res, 403, { error: 'Only sellers can list projects' });
    const body = await parseBody(req);
    const project = {
      id: `p${Date.now()}`,
      name: String(body.name || '').trim(),
      type: body.type,
      location: String(body.location || '').trim(),
      vintage_year: Number(body.vintage_year),
      total_credits: Number(body.total_credits),
      available_credits: Number(body.total_credits),
      price_per_credit: Number(body.price_per_credit),
      description: String(body.description || '').trim(),
      co2_tonnes: Number(body.total_credits),
      seller_name: user.full_name,
      seller_id: user.id,
      verified: false,
    };
    if (!project.name || !project.type || !project.location || !project.vintage_year || !project.total_credits || !project.price_per_credit || !project.description) return send(res, 400, { error: 'Missing project fields' });
    const ai = await analyzeProject({ ...project, gps: body.gps || '', standard: body.standard || '' });
    project.verified = Boolean(ai.co2_verified);
    projects.push(project);
    evidenceVault[project.id] = {
      score: Number(ai.score || 0),
      label: ai.label || 'Pending',
      sat_dates: ai.co2_verified ? [new Date().toISOString().slice(0, 7)] : [],
      iot_sensors: ai.co2_verified ? Math.max(2, Math.min(18, Math.round(project.total_credits / 100))) : 0,
      auditor: ai.co2_verified ? 'AI Pre-Screened - auditor required' : 'Pending',
      standard: body.standard || 'Pending',
      ipfs: `Qm${crypto.randomBytes(24).toString('hex')}`,
      gps: body.gps || '',
      area_ha: 0,
      trees_count: project.type === 'REFORESTATION' ? Math.round(project.total_credits * 45) : 0,
      co2_verified: Boolean(ai.co2_verified),
      ai_summary: ai.ai_summary,
      risks: ai.risks || [],
    };
    securityEvents.unshift({ event_type: 'AI_GREENWASH_SCAN', ip_address: 'internal', detail: `${project.name} scored ${evidenceVault[project.id].score}/100`, severity: project.verified ? 'INFO' : 'WARNING', created_at: new Date().toISOString() });
    return send(res, 201, { project, evidence: evidenceVault[project.id], state: stateFor(user) });
  }

  if (req.method === 'POST' && pathname === '/api/buy') {
    if (user.role !== 'buyer') return send(res, 403, { error: 'Only buyers can purchase credits' });
    const body = await parseBody(req);
    const project = projects.find((item) => item.id === body.projectId);
    const amount = Number(body.amount);
    if (!project || !amount || amount < 1) return send(res, 400, { error: 'Invalid purchase' });
    const total = amount * project.price_per_credit;
    if (amount > project.available_credits) return send(res, 400, { error: 'Not enough credits available' });
    if (total > user.eth_balance) return send(res, 400, { error: 'Insufficient ETH balance' });
    const txHash = randomTx();
    project.available_credits -= amount;
    project.co2_tonnes = Math.max(0, project.co2_tonnes - amount);
    user.eth_balance -= total;
    user.credit_balance += amount;
    const tx = { id: hashId('tx'), blockchain_tx: txHash, project_id: project.id, project_name: project.name, buyer_id: user.id, credits: amount, total_amount: total.toFixed(6), seller_payout: (total * 0.975).toFixed(6), status: 'confirmed', created_at: new Date().toISOString() };
    transactions.push(tx);
    const existing = holdings.find((item) => item.userId === user.id && item.projectId === project.id);
    if (existing) existing.credits += amount;
    else holdings.push({ userId: user.id, projectId: project.id, credits: amount, project });
    for (let i = 0; i < Math.min(amount, 5); i++) {
      ledger.push({ id: `CC-N${String(ledger.length + 1).padStart(4, '0')}`, projectId: project.id, projectName: project.name, projectType: project.type, owner: user.wallet_address ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}` : '0xYou...', status: 'active', vintage: project.vintage_year, mintedAt: new Date().toISOString().split('T')[0], txHash, prevOwners: [project.seller_name] });
    }
    return send(res, 200, { transaction: tx, state: stateFor(user) });
  }

  if (req.method === 'POST' && pathname === '/api/retire') {
    const body = await parseBody(req);
    const holding = holdings.find((item) => item.userId === user.id && item.projectId === body.projectId && item.credits > 0);
    if (!holding) return send(res, 400, { error: 'No credits to retire' });
    holding.credits -= 1;
    user.credit_balance = Math.max(0, user.credit_balance - 1);
    ledger.push({ id: `CC-R${Date.now().toString().slice(-6)}`, projectId: holding.projectId, projectName: holding.project.name, projectType: holding.project.type, owner: 'BURNED', status: 'retired', vintage: holding.project.vintage_year, mintedAt: new Date().toISOString().split('T')[0], txHash: randomTx(), prevOwners: [user.wallet_address || user.email] });
    return send(res, 200, { state: stateFor(user) });
  }

  if (req.method === 'POST' && pathname === '/api/watchlist') {
    const body = await parseBody(req);
    const idx = watchlist.findIndex((item) => item.userId === user.id && item.projectId === body.projectId);
    if (idx >= 0) watchlist.splice(idx, 1);
    else watchlist.push({ userId: user.id, projectId: body.projectId });
    return send(res, 200, { state: stateFor(user) });
  }

  if (req.method === 'POST' && pathname === '/api/ai/calculator') {
    const body = await parseBody(req);
    const advice = await calculatorAdvice(body);
    return send(res, 200, advice);
  }

  return send(res, 404, { error: 'API route not found' });
}

function serveStatic(req, res, pathname) {
  const file = pathname === '/' ? HTML_FILE : path.join(__dirname, pathname);
  if (!file.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(file, (error, content) => {
    if (error) {
      res.writeHead(404);
      return res.end('Not found');
    }
    const ext = path.extname(file).toLowerCase();
    const type = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'text/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    if (pathname.startsWith('/api/')) return routeApi(req, res, pathname);
    return serveStatic(req, res, pathname);
  } catch (error) {
    return send(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CarbonChain backend running at http://${HOST}:${PORT}`);
  const enabled = [
    process.env.OPENAI_API_KEY && `OpenAI ${OPENAI_MODEL}`,
    process.env.GROK_API_KEY && `Grok ${GROK_MODEL}`,
    process.env.GEMINI_API_KEY && `Gemini ${GEMINI_MODEL}`,
  ].filter(Boolean);
  console.log(enabled.length ? `AI providers enabled: ${enabled.join(', ')}. Local fallback is always available.` : 'No cloud AI key set; using local AI fallback analysis.');
});
