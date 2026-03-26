import Fuse from 'fuse.js';
import { Trash2Icon } from 'lucide-react';
import * as React from 'react';
import { VList } from 'virtua';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { sendMessage } from '@/lib/utils';
import { extractChannelUrl, extractDomain } from '@/utils/domain';
import { type VolumeEntry, volumeEntries } from '@/utils/storage';

export function ConfigList() {
  const [entries, setEntries] = React.useState<VolumeEntry[]>([]);
  const [query, setQuery] = React.useState('');
  const activeTabIdRef = React.useRef<number | undefined>(undefined);
  const activeEntryIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    volumeEntries.getValue().then(setEntries);
    const unwatch = volumeEntries.watch((newEntries) => {
      setEntries(newEntries ?? []);
    });
    return unwatch;
  }, []);

  // Detect the active tab and find which saved entry matches it
  React.useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(async ([tab]) => {
        if (!tab?.id || !tab?.url) return;
        activeTabIdRef.current = tab.id;
        const domain = extractDomain(tab.url);
        const channelUrl = extractChannelUrl(tab.url);
        const stored = await volumeEntries.getValue();
        const match = stored.find(
          (e) =>
            e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
        );
        if (match) activeEntryIdRef.current = match.id;
      });
  }, []);

  const debounceTimers = React.useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  function handleVolumeChange(id: string, volume: number) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, volume } : e)));

    // Live feedback: apply to the active tab if this entry matches it
    if (
      id === activeEntryIdRef.current &&
      activeTabIdRef.current !== undefined
    ) {
      sendMessage(activeTabIdRef.current, {
        type: 'SET_VOLUME',
        gain: volume / 100,
      });
    }

    const existing = debounceTimers.current.get(id);
    if (existing) clearTimeout(existing);

    debounceTimers.current.set(
      id,
      setTimeout(async () => {
        const current = await volumeEntries.getValue();
        await volumeEntries.setValue(
          current.map((e) => (e.id === id ? { ...e, volume } : e)),
        );
        debounceTimers.current.delete(id);
      }, 300),
    );
  }

  async function handleDelete(id: string) {
    const current = await volumeEntries.getValue();
    await volumeEntries.setValue(current.filter((e) => e.id !== id));
  }

  // Clean up any pending timers on unmount
  React.useEffect(() => {
    return () => {
      debounceTimers.current.forEach(clearTimeout);
    };
  }, []);

  const filteredEntries = React.useMemo(() => {
    if (!query.trim()) return entries;
    const fuse = new Fuse(entries, {
      keys: ['domain', 'channelUrl'],
      threshold: 0.35,
    });
    return fuse.search(query).map((r) => r.item);
  }, [entries, query]);

  if (entries.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 py-10 text-xs text-muted-foreground'>
        <span>No saved volume configs yet.</span>
        <span>Use the Volume tab to add one.</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='px-4 pt-3'>
        <Input
          placeholder='Filter by domain or channel…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='h-8 text-xs'
        />
      </div>

      {filteredEntries.length === 0 ? (
        <div className='flex items-center justify-center py-10 text-xs text-muted-foreground'>
          No matches found.
        </div>
      ) : (
        <VList style={{ height: '360px' }}>
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className='flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0'
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='flex flex-col min-w-0'>
                  <span className='truncate text-xs font-medium text-foreground'>
                    {entry.domain}
                  </span>
                  {entry.channelUrl && (
                    <ChannelUrlFormat channelUrl={entry.channelUrl} />
                  )}
                </div>
                <div className='flex items-center gap-2 shrink-0'>
                  <span className='text-xs tabular-nums text-foreground'>
                    {entry.volume}%
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDelete(entry.id)}
                          aria-label={`Delete ${entry.domain}`}
                        >
                          <Trash2Icon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Delete</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Slider
                min={0}
                max={300}
                step={1}
                value={[entry.volume]}
                onValueChange={([v]) => handleVolumeChange(entry.id, v)}
              />
            </div>
          ))}
        </VList>
      )}
    </div>
  );
}

/**
 * If the channel URL contains multiple segments, only show the last one for better readability.
 */
const ChannelUrlFormat = ({ channelUrl }: { channelUrl: string }) => {
  if (channelUrl.includes('/')) {
    return (
      <span className='truncate text-[11px] text-muted-foreground'>{`/${channelUrl.split('/').filter(Boolean).slice(-1).join('/')}`}</span>
    );
  }

  return (
    <span className='truncate text-[11px] text-muted-foreground'>
      {channelUrl}
    </span>
  );
};
