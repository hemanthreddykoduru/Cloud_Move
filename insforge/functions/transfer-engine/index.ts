// @ts-nocheck
// transfer-engine/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@insforge/sdk@latest";

// This is a Deno edge function that executes the transfer logic
// Note: Edge functions may have execution time limits (e.g., 60-120 seconds).
// For large files, you'll need to chunk uploads and invoke this function recursively or use a dedicated worker.

serve(async (req) => {
  try {
    const { transferId } = await req.json();
    if (!transferId) {
      return new Response(JSON.stringify({ error: 'Missing transferId' }), { status: 400 });
    }

    const insforgeUrl = Deno.env.get('INSFORGE_URL') ?? '';
    const insforgeServiceRoleKey = Deno.env.get('INSFORGE_SERVICE_ROLE_KEY') ?? '';

    const insforge = createClient(insforgeUrl, insforgeServiceRoleKey);

    // 1. Fetch the transfer details
    const { data: transfer, error: fetchError } = await insforge
      .from('transfers')
      .select('*, transfer_files(*)')
      .eq('id', transferId)
      .single();

    if (fetchError || !transfer) {
      throw fetchError || new Error('Transfer not found');
    }

    // 2. Mark transfer as IN_PROGRESS
    await insforge
      .from('transfers')
      .update({ status: 'IN_PROGRESS', started_at: new Date().toISOString() })
      .eq('id', transferId);

    // 3. (Mocked) Process files
    // In reality, here you would:
    // a. Fetch tokens for source_account_id and destination_account_id from your secure vault
    // b. Initialize googleapis clients
    // c. Stream the file in chunks from source to destination
    // d. Update transfer_files status, bytes transferred, and checksums
    
    let totalTransferred = 0;
    for (const file of transfer.transfer_files) {
      // Mark file IN_PROGRESS
      await insforge.from('transfer_files').update({ status: 'IN_PROGRESS' }).eq('id', file.id);
      
      // Simulate transfer delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark file COMPLETED
      await insforge.from('transfer_files').update({ 
        status: 'COMPLETED',
        transferred_bytes: file.size
      }).eq('id', file.id);
      totalTransferred += file.size;
    }

    // 4. Mark transfer as COMPLETED
    await insforge
      .from('transfers')
      .update({ 
        status: 'COMPLETED', 
        completed_at: new Date().toISOString(),
        transferred_bytes: totalTransferred
      })
      .eq('id', transferId);

    return new Response(JSON.stringify({ success: true, transferId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Transfer engine error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
