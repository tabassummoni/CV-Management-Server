import jsforce from 'jsforce';
import dotenv from 'dotenv';
dotenv.config();

async function testSalesforceConnection() {
  try {
    console.log('⏳ Fetching Access Token via Client Credentials...');

    const tokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
    
    // Client Credentials Request Payload
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Authentication Failed');
    }

    console.log('✅ Access Token Received Successfully!');

    // Initialize JSForce Connection with Token & Instance URL
    const conn = new jsforce.Connection({
      instanceUrl: data.instance_url,
      accessToken: data.access_token
    });

    // Verify Connection by querying User Info
    const identity = await conn.identity();
    console.log('🎉 Salesforce Connected Successfully!');
    console.log('Logged in User:', identity.username);
    console.log('Org ID:', identity.organization_id);

  } catch (error) {
    console.error('❌ Salesforce Connection Error:', error.message);
  }
}

testSalesforceConnection();