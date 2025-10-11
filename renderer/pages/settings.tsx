import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const api = typeof window !== 'undefined' ? window.api : undefined;

function Settings() {
  const [savedPath, setSavePath] = useState<string>('');

  useEffect(() => {
    const fetchSavePath = async () => {
      const path = (await api?.getSetting('savePath')) as string;
      setSavePath(path);
    };
    fetchSavePath();
  }, []);

  const handleSavePathChange = e => {
    const value = e.target.value;
    setSavePath(value);
    api?.setSetting('savePath', value);
  };

  return (
    <div className='container mx-auto p-4'>
      <h2 className='text-2xl font-bold mb-4'>Settings</h2>
      <div>
        <Button asChild>
          <Link href='/index'>Back</Link>
        </Button>
      </div>
      <div className='mt-4'>
        <Label htmlFor='savePath'>Save path:</Label>
        <Input
          type='text'
          id='savePath'
          value={savedPath as string}
          onChange={handleSavePathChange}
        />
      </div>
    </div>
  );
}

export default Settings;
