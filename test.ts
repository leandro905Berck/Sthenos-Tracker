import OpenAI from 'npm:openai'
console.log('starting...');
try {
  const o = new OpenAI({ apiKey: undefined });
  console.log('success');
} catch (e) {
  console.log('error: ' + e.message);
}
