import React, { useEffect, useState } from 'react';
import settings from 'electron-settings';
import Link from 'next/link';

function Settings() {
  const [savedPath, setSavePath] = useState<string>('');

  useEffect(() => {
    const fetchSavePath = async () => {
      const path = (await settings.get('savePath')) as string;
      setSavePath(path);
    };
    fetchSavePath();
  }, []);

  const handleSavePathChange = e => {
    const value = e.target.value;
    setSavePath(value);
    settings.set('savePath', value);
  };

  return (
    <div>
      <h2>Settings</h2>
      <div>
        <Link href='/index'>Back</Link>
      </div>
      <div>
        <label htmlFor='savePath'>Save path:</label>
        <input
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
