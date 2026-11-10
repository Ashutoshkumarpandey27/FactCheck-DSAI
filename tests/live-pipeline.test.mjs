import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../worker-src/worker.mjs';

const extractedClaims = {inputLanguage: 'English', claims: [{id: 'CL-01', text: 'The application deadline is 31 December 2026.', normalized: 'The application deadline is 31 December 2026.', timeSensitive: true, supportedDomain: true, checkable: true}]};
const groundedFinding = {findings: [{claimId: 'CL-01', label: 'Contradicted', summary: 'The official notice gives an earlier deadline.', messageClaim: 'The application deadline is 31 December 2026.', sourceEstablishes: 'Applications close on 30 November 2026.', dates: 'Notice published 2 November 2026; deadline 30 November 2026.', scope: 'Nirmal Pradesh student support applications.', unresolved: 'No unresolved question affects the deadline finding.', evidenceIds: ['EV-01']}]};
const responsesPayload = (payload) => new Response(JSON.stringify({output: [{content: [{type: 'output_text', text: JSON.stringify(payload)}]}]}), {status: 200, headers: {'content-type': 'application/json'}});

function providerFetch({finding = groundedFinding} = {}) {
  let structuredCalls = 0;
  return async (input) => {
    const url = new URL(String(input));
    if (url.hostname === 'api.openai.com' && url.pathname === '/v1/responses') {
      structuredCalls += 1;
      return responsesPayload(structuredCalls === 1 ? extractedClaims : finding);
    }
    if (url.hostname === 'api.openai.com' && url.pathname === '/v1/chat/completions') {
      return new Response(JSON.stringify({choices: [{message: {content: 'An official notice is available.', annotations: [{type: 'url_citation', url_citation: {title: 'Student Support Application Notice', url: 'https://education.nirmal.gov.in/notices/student-support'}}]}}]}), {status: 200, headers: {'content-type': 'application/json'}});
    }
    if (url.hostname === 'education.nirmal.gov.in') {
      return new Response('<!doctype html><title>Student Support Application Notice</title><main><p>Published 2 November 2026.</p><p>Applications for Nirmal Pradesh student support close on 30 November 2026.</p></main>', {status: 200, headers: {'content-type': 'text/html; charset=utf-8'}});
    }
    throw new Error(`Unexpected test request: ${url}`);
  };
}

async function analyze(fetchImpl, {findingBody = {input: extractedClaims.claims[0].text, inputType: 'text'}, requestUrl = 'http://127.0.0.1:8787/api/analyze', runtimeEnv = {}, localKey = 'test-openai-key'} = {}) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    const headers = {'content-type': 'application/json'};
    if (localKey) headers['x-sachcheck-openai-key'] = localKey;
    return await worker.fetch(new Request(requestUrl, {method: 'POST', headers, body: JSON.stringify(findingBody)}), runtimeEnv);
  } finally { globalThis.fetch = originalFetch; }
}

test('localhost BYOK pipeline returns grounded evidence using OpenAI web search', {concurrency: false}, async () => {
  const response = await analyze(providerFetch());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.report.mode, 'live');
  assert.equal(body.report.findings[0].label, 'Contradicted');
  assert.deepEqual(body.report.findings[0].evidenceIds, ['EV-01']);
  assert.equal(body.report.evidence[0].relationship, 'Contradicts');
  assert.equal(body.report.evidence[0].primary, true);
  assert.match(body.report.evidence[0].passage, /30 November 2026/);
});

test('invalid model citations are downgraded to insufficient evidence', {concurrency: false}, async () => {
  const finding = structuredClone(groundedFinding);
  finding.findings[0].evidenceIds = ['EV-99'];
  finding.findings[0].label = 'Supported';
  const response = await analyze(providerFetch({finding}));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.report.findings[0].label, 'Insufficient evidence');
  assert.deepEqual(body.report.findings[0].evidenceIds, []);
});

test('client-provided keys are rejected outside localhost', {concurrency: false}, async () => {
  const response = await analyze(providerFetch(), {requestUrl: 'https://sachcheck.example/api/analyze'});
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, 'MISSING_CREDENTIALS');
  assert.deepEqual(body.missing, ['OPENAI_API_KEY']);
});

test('missing local key never falls back to a fictional report', {concurrency: false}, async () => {
  const response = await analyze(providerFetch(), {localKey: ''});
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.code, 'MISSING_CREDENTIALS');
  assert.equal(body.report, undefined);
});

test('subjective superlative preserves the submitted meaning and is not fact-checkable', {concurrency: false}, async () => {
  let providerCalls = 0;
  const response = await analyze(async () => { providerCalls += 1; throw new Error('Provider must not be called for an unanchored opinion'); }, {findingBody: {input: 'cricket is best sport', inputType: 'text'}});
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(providerCalls, 0);
  assert.equal(body.report.input, 'cricket is best sport');
  assert.equal(body.report.claims[0].text, 'cricket is best sport');
  assert.equal(body.report.claims[0].normalized, 'cricket is best sport');
  assert.equal(body.report.claims[0].checkable, false);
  assert.equal(body.report.findings[0].label, 'Not fact-checkable');
  assert.deepEqual(body.report.findings[0].evidenceIds, []);
  assert.deepEqual(body.report.evidence, []);
});

test('general sports passage cannot support a cricket-specific conclusion', {concurrency: false}, async () => {
  const cricketClaim = {inputLanguage: 'English', claims: [{id: 'CL-01', text: 'BCCI is the governing body for cricket in India.', normalized: 'BCCI governs cricket in India.', timeSensitive: false, supportedDomain: true, checkable: true}]};
  const cricketFinding = {findings: [{claimId: 'CL-01', label: 'Supported', summary: 'The source supports the claim.', messageClaim: 'BCCI governs cricket in India.', sourceEstablishes: 'BCCI is the governing body.', dates: '', scope: 'India', unresolved: '', evidenceIds: ['EV-01']}]};
  let structuredCalls = 0;
  const fetchImpl = async (input) => {
    const url = new URL(String(input));
    if (url.hostname === 'api.openai.com' && url.pathname === '/v1/responses') {
      structuredCalls += 1;
      return responsesPayload(structuredCalls === 1 ? cricketClaim : cricketFinding);
    }
    if (url.hostname === 'api.openai.com' && url.pathname === '/v1/chat/completions') {
      return new Response(JSON.stringify({choices: [{message: {annotations: [{type: 'url_citation', url_citation: {title: 'Recognition of National Sports Federations', url: 'https://sports.example/federations'}}]}}]}), {status: 200, headers: {'content-type': 'application/json'}});
    }
    if (url.hostname === 'sports.example') {
      return new Response('<!doctype html><title>Recognition of National Sports Federations</title><main><p>The ministry grants annual recognition to national sports federations that meet its governance requirements.</p></main>', {status: 200, headers: {'content-type': 'text/html'}});
    }
    throw new Error(`Unexpected test request: ${url}`);
  };
  const response = await analyze(fetchImpl, {findingBody: {input: 'BCCI is the governing body for cricket in India.', inputType: 'text'}});
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.report.findings[0].label, 'Insufficient evidence');
  assert.deepEqual(body.report.findings[0].evidenceIds, []);
});

test('screenshot extraction sends a high-detail image and returns editable text', {concurrency: false}, async () => {
  const originalFetch = globalThis.fetch;
  let providerRequest;
  globalThis.fetch = async (_input, init) => {
    providerRequest = JSON.parse(init.body);
    return responsesPayload({text: 'cricket is best sport'});
  };
  try {
    const response = await worker.fetch(new Request('http://127.0.0.1:8787/api/extract-image', {method: 'POST', headers: {'content-type': 'application/json', 'x-sachcheck-openai-key': 'test-openai-key'}, body: JSON.stringify({image: 'data:image/png;base64,iVBORw0KGgo='})}), {});
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.text, 'cricket is best sport');
    const imagePart = providerRequest.input[0].content.find((item) => item.type === 'input_image');
    assert.equal(imagePart.image_url, 'data:image/png;base64,iVBORw0KGgo=');
    assert.equal(imagePart.detail, 'high');
    assert.equal(providerRequest.store, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('screenshot extraction rejects unsupported image formats before provider use', {concurrency: false}, async () => {
  const originalFetch = globalThis.fetch;
  let providerCalls = 0;
  globalThis.fetch = async () => { providerCalls += 1; throw new Error('Provider should not be called'); };
  try {
    const response = await worker.fetch(new Request('http://127.0.0.1:8787/api/extract-image', {method: 'POST', headers: {'content-type': 'application/json', 'x-sachcheck-openai-key': 'test-openai-key'}, body: JSON.stringify({image: 'data:image/svg+xml;base64,PHN2Zz4='})}), {});
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_IMAGE');
    assert.equal(providerCalls, 0);
  } finally { globalThis.fetch = originalFetch; }
});
