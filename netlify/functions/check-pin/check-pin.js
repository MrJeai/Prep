const crypto = require('crypto');

const DEFAULT_PIN_HASH = '6c77b607e17df16d31c46c746a36328056fc8d153b71370ed1a56d4c0700238e'; // SHA256 of '1590'

function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  try {
    const { pin } = JSON.parse(event.body || '{}');
    const pinCodeHash = process.env.PIN_CODE_HASH || DEFAULT_PIN_HASH;
    const submittedPinHash = hashPin(pin);

    if (submittedPinHash === pinCodeHash) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true })
      };
    }

    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Incorrect PIN' })
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid request' })
    };
  }
};
