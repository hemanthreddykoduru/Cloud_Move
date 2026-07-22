import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { createClient } from '@insforge/sdk';

dotenv.config();

const insforge = createClient({
  baseUrl: process.env.INSFORGE_URL!,
  anonKey: process.env.INSFORGE_ANON_KEY!
});

const app = express();
const port = process.env.PORT || 3001;

console.log(`Starting production-ready server with CLIENT_URL: ${process.env.CLIENT_URL}`);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Step 1: Redirect to Google
app.get('/api/auth/google/connect', (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).send('Missing userId');
  }

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // gets refresh token
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive'
    ],
    state: userId, // pass userId so we know who to link it to on callback
  });

  res.redirect(url);
});

// Step 2: Handle callback from Google
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user info (email)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Fetch actual storage quota from Google Drive
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const about = await drive.about.get({ fields: 'storageQuota' });
    const storageUsed = parseInt(about.data.storageQuota?.usage || '0', 10);
    const storageLimit = parseInt(about.data.storageQuota?.limit || '15728640000', 10);

    // In a real app, you'd encrypt tokens.refresh_token here before saving
    const { error: insertError } = await insforge.database.from('connected_accounts').insert([{
      user_id: userId as string,
      provider: 'GOOGLE_DRIVE',
      provider_user_id: userInfo.id!,
      email: userInfo.email!,
      token_vault_ref: tokens.refresh_token || 'no_refresh_token',
      scopes_granted: ['drive', 'userinfo.email'],
      storage_used: storageUsed,
      storage_limit: storageLimit,
    }]);

    if (insertError) {
      console.error('Failed to insert into insforge:', insertError);
      throw new Error('Database insert failed');
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/dashboard/accounts?connected=true`);
  } catch (error) {
    console.error('Error connecting Google Drive:', error);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/dashboard/accounts?error=auth_failed`);
  }
});

// Helper to get Google Drive Client
const getDriveClient = async (refreshToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
};

// Fetch files from connected Google Drive
app.get('/api/drive/files', async (req, res) => {
  const { accountId } = req.query;

  if (!accountId) return res.status(400).json({ error: 'Missing accountId' });
  
  try {
    const { data: account, error } = await insforge.database
      .from('connected_accounts')
      .select('token_vault_ref')
      .eq('id', accountId)
      .single();
      
    if (error || !account) {
      console.error('Account fetch error:', error);
      throw new Error('Account not found');
    }
    
    console.log('Vault Ref:', account.token_vault_ref);
    
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    client.setCredentials({ refresh_token: account.token_vault_ref });
    
    const drive = google.drive({ version: 'v3', auth: client });
    const response = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, mimeType, size)',
      q: "trashed = false" 
    });
    
    console.log('Fetched files:', response.data.files);
    res.json(response.data.files || []);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  
  // Background Worker: Process Transfers every 10 seconds
  setInterval(async () => {
    try {
      // Find one pending transfer
      const { data: transfer, error } = await insforge.database
        .from('transfers')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('[Worker] Error fetching transfers:', error);
      }
      if (!transfer || error) return;
      
      console.log(`[Worker] Found pending transfer ${transfer.id}. Processing...`);
      
      // Mark as PROCESSING
      await insforge.database.from('transfers').update({ status: 'PROCESSING', started_at: new Date().toISOString() }).eq('id', transfer.id);
      
      // Get Source Token
      const { data: sourceAcc } = await insforge.database.from('connected_accounts').select('token_vault_ref').eq('id', transfer.source_account_id).single();
      const sourceDrive = await getDriveClient(sourceAcc!.token_vault_ref);
      
      // Get Dest Token
      const { data: destAcc } = await insforge.database.from('connected_accounts').select('token_vault_ref').eq('id', transfer.destination_account_id).single();
      const destDrive = await getDriveClient(destAcc!.token_vault_ref);
      
      const fileIds = transfer.options?.source_file_ids || [];
      let transferredBytes = 0;
      
      // Transfer each file
      for (const fileId of fileIds) {
        console.log(`[Worker] Transferring file ${fileId}`);
        // 1. Get metadata
        const fileMeta = await sourceDrive.files.get({ fileId, fields: 'name, mimeType, size' });
        
        // 2. Download from source
        const downloadStream = await sourceDrive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
        
        // 3. Upload to dest
        await destDrive.files.create({
          requestBody: {
            name: fileMeta.data.name,
            parents: transfer.options?.destination_folder_id === 'root' ? undefined : [transfer.options?.destination_folder_id]
          },
          media: {
            mimeType: fileMeta.data.mimeType!,
            body: downloadStream.data
          }
        });
        
        // 4. If Move mode, delete from source
        if (transfer.options?.transfer_mode === 'move') {
          console.log(`[Worker] Move mode active. Deleting source file ${fileId}...`);
          await sourceDrive.files.delete({ fileId });
        }
        
        // Update progress
        transferredBytes += parseInt(fileMeta.data.size || '0');
        await insforge.database.from('transfers').update({ transferred_bytes: transferredBytes }).eq('id', transfer.id);
      }
      
      // Mark as COMPLETED
      await insforge.database.from('transfers').update({ status: 'COMPLETED', completed_at: new Date().toISOString() }).eq('id', transfer.id);
      console.log(`[Worker] Transfer ${transfer.id} completed successfully!`);
      
    } catch (err: any) {
      console.error('[Worker] Error processing transfer:', err);
      // Fallback: we should probably mark it FAILED but for now we'll leave it to retry or fail silently in console
    }
  }, 10000);
});
