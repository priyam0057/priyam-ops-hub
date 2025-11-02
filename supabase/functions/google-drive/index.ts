import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, accessToken, fileId, fileName, fileContent } = await req.json();

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    switch (action) {
      case 'list': {
        // List files in the "Priyam Backups" folder
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='Priyam Backups' and mimeType='application/vnd.google-apps.folder'&fields=files(id)`,
          { headers }
        );
        const folderData = await response.json();
        
        let folderId = folderData.files?.[0]?.id;
        
        // If folder doesn't exist, create it
        if (!folderId) {
          const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: 'Priyam Backups',
              mimeType: 'application/vnd.google-apps.folder',
            }),
          });
          const newFolder = await createResponse.json();
          folderId = newFolder.id;
        }

        // List files in the folder
        const filesResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=modifiedTime desc`,
          { headers }
        );
        const filesData = await filesResponse.json();

        return new Response(
          JSON.stringify({ files: filesData.files || [], folderId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'upload': {
        // Get or create folder
        const folderResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='Priyam Backups' and mimeType='application/vnd.google-apps.folder'&fields=files(id)`,
          { headers }
        );
        const folderData = await folderResponse.json();
        
        let folderId = folderData.files?.[0]?.id;
        
        if (!folderId) {
          const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: 'Priyam Backups',
              mimeType: 'application/vnd.google-apps.folder',
            }),
          });
          const newFolder = await createResponse.json();
          folderId = newFolder.id;
        }

        // Create metadata
        const metadata = {
          name: fileName,
          parents: [folderId],
        };

        // Upload file using multipart upload
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/zip\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          fileContent +
          close_delim;

        const uploadResponse = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary="${boundary}"`,
            },
            body: multipartRequestBody,
          }
        );

        const uploadData = await uploadResponse.json();

        return new Response(
          JSON.stringify(uploadData),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'download': {
        const downloadResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          { headers }
        );
        const fileData = await downloadResponse.arrayBuffer();
        
        return new Response(
          JSON.stringify({ content: Array.from(new Uint8Array(fileData)) }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}`,
          { method: 'DELETE', headers }
        );

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
