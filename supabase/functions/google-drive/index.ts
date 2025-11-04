import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { action, accessToken, fileId, fileName, fileContent, projectName, folderName } = await req.json();

  switch (action) {
    case 'list': {
      // Determine folder hierarchy: Priyam Backups / [Project Name or folderName]
      const targetFolder = folderName || projectName || 'Priyam Backups';
      
      // Get or create Priyam Backups folder
      let mainFolderId = await getOrCreateFolder(accessToken, 'Priyam Backups', null);
      
      // If projectName or folderName specified, get/create subfolder
      let folderId = mainFolderId;
      if (targetFolder !== 'Priyam Backups') {
        folderId = await getOrCreateFolder(accessToken, targetFolder, mainFolderId);
      }

      // List files in the target folder
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,size,createdTime,modifiedTime)&orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      const listData = await listResponse.json();
      return new Response(JSON.stringify(listData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    case 'upload': {
      // Determine folder hierarchy
      const targetFolder = folderName || projectName || 'Priyam Backups';
      
      // Get or create Priyam Backups folder
      let mainFolderId = await getOrCreateFolder(accessToken, 'Priyam Backups', null);
      
      // If projectName or folderName specified, get/create subfolder
      let folderId = mainFolderId;
      if (targetFolder !== 'Priyam Backups') {
        folderId = await getOrCreateFolder(accessToken, targetFolder, mainFolderId);
      }

      // Upload file to the folder
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        name: fileName,
        parents: [folderId]
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n' +
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
            'Content-Type': 'multipart/related; boundary=' + boundary
          },
          body: multipartRequestBody
        }
      );

      const uploadData = await uploadResponse.json();
      return new Response(JSON.stringify(uploadData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    case 'download': {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      const arrayBuffer = await response.arrayBuffer();
      const content = Array.from(new Uint8Array(arrayBuffer));

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    case 'delete': {
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});

// Helper function to get or create a folder
async function getOrCreateFolder(accessToken: string, folderName: string, parentId: string | null): Promise<string> {
  // Search for existing folder
  const query = parentId 
    ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );

  const searchData = await searchResponse.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new folder
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  if (parentId) {
    metadata.parents = [parentId];
  }

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata)
    }
  );

  const folderData = await createResponse.json();
  return folderData.id;
}
