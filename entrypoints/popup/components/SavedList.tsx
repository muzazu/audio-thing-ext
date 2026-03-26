import Fuse from 'fuse.js';
import { ScrollArea } from 'radix-ui';
import * as React from 'react';
import { Virtualizer } from 'virtua';

import { Input } from '@/components/ui/input';
import { ScrollBar } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useActiveTab } from '@/hooks/useActiveTab';
import { sendMessage } from '@/lib/utils';
import { type VolumeEntry, volumeEntries } from '@/utils/storage';
import { deleteVolumeEntry } from '@/utils/volume-entries';

import { VolumeEntryRow } from './VolumeEntryRow';

export function SavedList() {
  const [entries, setEntries] = React.useState<VolumeEntry[]>([]);
  const [query, setQuery] = React.useState('');
  const activeTab = useActiveTab();

  React.useEffect(() => {
    volumeEntries.getValue().then(setEntries);
    const unwatch = volumeEntries.watch((newEntries) => {
      setEntries(newEntries ?? []);
    });
    return unwatch;
  }, []);

  const debounceTimers = React.useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map());

  const handleVolumeChange = React.useCallback(
    (id: string, volume: number) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, volume } : e)),
      );

      // Live feedback: apply to the active tab if this entry matches it
      if (id === activeTab.existingEntry?.id && activeTab.tabId !== undefined) {
        sendMessage(activeTab.tabId, {
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
    },
    [activeTab],
  );

  const handleDelete = React.useCallback(
    async (id: string) => {
      await deleteVolumeEntry(id);

      if (id === activeTab.existingEntry?.id && activeTab.tabId !== undefined) {
        sendMessage(activeTab.tabId, {
          type: 'SET_VOLUME',
          gain: 1.0,
        });
      }
    },
    [activeTab],
  );

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

  const scrollRef = React.useRef<HTMLDivElement>(null);

  if (entries.length === 0) {
    return (
      <div
        data-testid='empty-message'
        className='flex flex-col items-center justify-center gap-2 py-10 text-xs text-muted-foreground'
      >
        <span>No saved volume configs yet.</span>
        <span>Use the Volume tab to add one.</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='px-4 pt-3'>
        <Input
          data-testid='filter-input'
          placeholder='Filter by domain or channel…'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className='h-8 text-xs'
        />
      </div>

      {filteredEntries.length === 0 ? (
        <div
          data-testid='no-matches-message'
          className='flex items-center justify-center py-10 text-xs text-muted-foreground'
        >
          No matches found.
        </div>
      ) : (
        <TooltipProvider>
          <ScrollArea.Root data-slot='scroll-area' className='relative h-80'>
            <ScrollArea.Viewport
              data-slot='scroll-area-viewport'
              className='size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1'
              ref={scrollRef}
            >
              <Virtualizer scrollRef={scrollRef}>
                {filteredEntries.map((entry) => (
                  <VolumeEntryRow
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onVolumeChange={handleVolumeChange}
                  />
                ))}
              </Virtualizer>
            </ScrollArea.Viewport>
            <ScrollBar orientation='vertical' />
            <ScrollArea.Corner />
          </ScrollArea.Root>
        </TooltipProvider>
      )}
    </div>
  );
}
