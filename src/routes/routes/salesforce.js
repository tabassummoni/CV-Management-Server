import express from 'express';
import jsforce from 'jsforce';

const router = express.Router();

router.post('/sync', async (req, res) => {
  const { name, email, phone, company, bio } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const conn = new jsforce.Connection({
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com'
  });

  try {
    const passwordWithToken = (process.env.SF_PASSWORD || '') + (process.env.SF_SECURITY_TOKEN || '');
    await conn.login(process.env.SF_USERNAME, passwordWithToken);

    const accountName = company || `${name}'s Account`;
    const accountResult = await conn.sobject('Account').create({
      Name: accountName,
      Phone: phone || ''
    });

    if (!accountResult.success) {
      throw new Error('Failed to create Account in Salesforce');
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
    const lastName = nameParts[nameParts.length - 1] || 'Candidate';

    const contactResult = await conn.sobject('Contact').create({
      FirstName: firstName,
      LastName: lastName,
      Email: email,
      Phone: phone || '',
      Description: bio || 'Synced from CV Management App',
      AccountId: accountResult.id
    });

    return res.status(200).json({
      message: 'Successfully synced Account and Contact to Salesforce!',
      accountId: accountResult.id,
      contactId: contactResult.id
    });

  } catch (error) {
    console.error('Salesforce Sync Error:', error);
    return res.status(500).json({ error: error.message || 'Salesforce integration failed' });
  }
});

export default router;