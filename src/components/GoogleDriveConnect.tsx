import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, CheckCircle2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const GoogleDriveConnect = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
    handleOAuthRedirect();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('google_drive_token');
    setAccessToken(token);
    setIsAuthenticated(!!token);
  };

  const handleOAuthRedirect = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'google_drive_auth') {
      exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'exchange-token', code }
      });

      if (error) throw error;

      if (data.access_token) {
        localStorage.setItem('google_drive_token', data.access_token);
        setAccessToken(data.access_token);
        setIsAuthenticated(true);
        
        toast({
          title: "Connected",
          description: "Google Drive connected successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Google Drive",
        variant: "destructive"
      });
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive', {
        body: { action: 'get-auth-url' }
      });

      if (error) throw error;

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize Google Drive connection",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_drive_token');
    setAccessToken(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Disconnected",
      description: "Google Drive has been disconnected"
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          Google Drive Integration
        </CardTitle>
        <CardDescription>Connect to backup your projects</CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-primary">Google Drive Connected</p>
                <p className="text-sm text-muted-foreground">Your projects can now be backed up</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={handleDisconnect}
              className="w-full gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Google Drive
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleGoogleAuth}
            className="w-full gap-2"
          >
            <Cloud className="h-4 w-4" />
            Connect Google Drive
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
