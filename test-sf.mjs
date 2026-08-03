import dotenv from 'dotenv';
import jsforce from 'jsforce';

dotenv.config();

async function testSalesforceConnection() {
  try {
    console.log('⏳ Fetching Access Token via Client Credentials...');

    // .env ফাইলের SF_LOGIN_URL ব্যবহার করা হচ্ছে
    const baseUrl = process.env.SF_LOGIN_URL.replace(/\/$/, '');
    const tokenUrl = `${baseUrl}/services/oauth2/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.SF_CLIENT_ID);
    params.append('client_secret', process.env.SF_CLIENT_SECRET);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`❌ Salesforce Error (${response.status}):`, responseText);
      return;
    }

    const tokenData = JSON.parse(responseText);
    console.log('✅ Access Token Received Successfully!');

    const conn = new jsforce.Connection({
      instanceUrl: tokenData.instance_url || baseUrl,
      accessToken: tokenData.access_token
    });

    const identity = await conn.identity();
    console.log('🎉 Salesforce Connected Successfully!');
    console.log('Logged in User ID:', identity.user_id);
    console.log('Org ID:', identity.organization_id);

  } catch (error) {
    console.error('❌ Salesforce Connection Error:', error.message);
  }
}

testSalesforceConnection();