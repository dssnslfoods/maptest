import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { encryptApiKey, decryptApiKey } from '@/features/admin/api-key';
import { testApiKey } from '@/features/admin/gemini-generator';
import { CheckCircle2, Eye, EyeOff, Loader2, Sparkles, XCircle } from 'lucide-react';
import type { UserSettings } from '@/types/database';
import { GRADE_LABELS } from '@/lib/utils';
import { UserManagementSection } from '@/features/admin/user-management-section';

export function SettingsPage() {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const qc = useQueryClient();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [school, setSchool] = useState(profile?.school_name ?? '');
  const [grade, setGrade] = useState(String(profile?.grade_level ?? ''));
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | boolean>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setSchool(profile?.school_name ?? '');
    setGrade(String(profile?.grade_level ?? ''));
  }, [profile]);

  const { data: settings } = useQuery({
    queryKey: ['settings', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<UserSettings | null> => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', profile!.id)
        .maybeSingle();
      return (data as UserSettings | null) ?? null;
    },
  });

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const payload = {
      full_name: fullName,
      school_name: school || null,
      grade_level: grade === '' ? null : Number(grade),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profile.id)
      .select('*')
      .single();
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Profile saved');
      if (data) setProfile(data as never);
    }
  };

  const saveApiKey = async () => {
    if (!profile) return;
    if (!apiKey || apiKey.length < 8) {
      toast.error('Enter a valid API key');
      return;
    }
    setSavingKey(true);
    const encrypted = await encryptApiKey(apiKey, profile.id);
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: profile.id, gemini_api_key_encrypted: encrypted, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    setSavingKey(false);
    if (error) toast.error(error.message);
    else {
      toast.success('API key saved');
      setApiKey('');
      qc.invalidateQueries({ queryKey: ['settings'] });
    }
  };

  const testConnection = async () => {
    if (!profile) return;
    setTestResult(null);
    setTesting(true);
    let key = apiKey;
    if (!key && settings?.gemini_api_key_encrypted) {
      try {
        key = await decryptApiKey(settings.gemini_api_key_encrypted, profile.id);
      } catch {
        toast.error('Could not decrypt stored key');
        setTesting(false);
        return;
      }
    }
    if (!key) {
      toast.error('No API key set');
      setTesting(false);
      return;
    }
    const ok = await testApiKey(key);
    setTesting(false);
    setTestResult(ok);
    if (ok) toast.success('Connection successful');
    else toast.error('API key did not authenticate');
  };

  const removeApiKey = async () => {
    if (!profile) return;
    if (!confirm('Remove the saved Gemini API key?')) return;
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: profile.id, gemini_api_key_encrypted: null, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );
    if (error) toast.error(error.message);
    else {
      toast.success('API key removed');
      qc.invalidateQueries({ queryKey: ['settings'] });
    }
  };

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="school">School</Label>
            <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} />
          </div>
          {profile?.role === 'student' && (
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade level</Label>
              <Select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">—</option>
                {Object.entries(GRADE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {(profile?.role === 'admin' || profile?.role === 'teacher') && <UserManagementSection />}

      {profile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI provider settings
            </CardTitle>
            <CardDescription>
              Gemini API key for question generation. Stored encrypted (AES-GCM) per user. Get a free key at{' '}
              <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="flex items-center gap-2">
                Current status
                {settings?.gemini_api_key_encrypted ? (
                  <Badge variant="success">Key on file</Badge>
                ) : (
                  <Badge variant="secondary">No key set</Badge>
                )}
              </Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">Gemini API key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder={settings?.gemini_api_key_encrypted ? '••••••••' : 'Paste your AIzaSy… key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle visibility"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={testConnection} disabled={testing}>
                {testing && <Loader2 className="h-4 w-4 animate-spin" />}
                {testResult === true ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : testResult === false ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : null}
                Test connection
              </Button>
              <Button onClick={saveApiKey} disabled={savingKey || !apiKey}>
                {savingKey && <Loader2 className="h-4 w-4 animate-spin" />}
                Save key
              </Button>
              {settings?.gemini_api_key_encrypted && (
                <Button variant="ghost" onClick={removeApiKey}>
                  Remove
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
