import express from 'express';
import jsforce from 'jsforce';

const router = express.Router();

router.post('/sync', async (req, res) => {
  const { name, email, phone, company } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    if (!process.env.SF_CLIENT_ID || !process.env.SF_CLIENT_SECRET) {
      console.error('Salesforce Connected App credentials (SF_CLIENT_ID, SF_CLIENT_SECRET) are not set.');
      return res.status(500).json({ error: 'Server is not configured for Salesforce integration.' });
    }

    const tokenUrl = `${process.env.SF_LOGIN_URL || 'https://login.salesforce.com'}/services/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET
    });

    const authResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const authData = await authResponse.json();

    if (!authResponse.ok) {
      throw new Error(authData.error_description || authData.error || 'Salesforce authentication failed');
    }

    const conn = new jsforce.Connection({
      instanceUrl: authData.instance_url,
      accessToken: authData.access_token
    });

    let accountId;
    const accountName = company || (email ? email.split('@')[1] : `${name}'s Fallback`);

    const existingAccounts = await conn.sobject('Account').find({ Name: accountName }).limit(1);

    if (existingAccounts.length > 0) {
      accountId = existingAccounts[0].Id;
    } else {
      // If no account is found, create a new one
      const accountResult = await conn.sobject('Account').create({
        Name: accountName,
        Phone: phone || ''
      });

      if (!accountResult.success) {
        const errorDetails = accountResult.errors.map(e => e.message).join(', ');
        throw new Error(`Failed to create Account in Salesforce: ${errorDetails}`);
      }
      accountId = accountResult.id;
    }

    const nameParts = name.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts.pop() : name;
    const firstName = nameParts.join(' ');

    const contactResult = await conn.sobject('Contact').create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      Phone: phone || '',
      Description: 'Synced from CV Management System',
      AccountId: accountId
    });

    return res.status(200).json({
      message: 'Successfully synced Account and Contact to Salesforce!',
      accountId: accountId,
      contactId: contactResult.id
    });

  } catch (error) {
    console.error('Salesforce Sync Error:', error);
    return res.status(500).json({ error: error.message || 'Salesforce integration failed' });
  }
});

export default router;