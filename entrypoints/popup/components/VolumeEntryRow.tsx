import { Trash2Icon } from 'lucide-react';
import * as React from 'react';

import type { VolumeEntry } from '@/utils/storage';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ChannelUrlFormat } from './ChannelUrlFormat';

interface VolumeEntryRowProps {
  entry: VolumeEntry;
  onDelete: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
}

export const VolumeEntryRow = React.memo(function VolumeEntryRow({
  entry,
  onDelete,
  onVolumeChange,
}: VolumeEntryRowProps) {
  return (
    <div
      data-testid='entry-row'
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                data-testid='delete-button'
                onClick={() => onDelete(entry.id)}
                aria-label={`Delete ${entry.domain}`}
              >
                <Trash2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <span>Delete</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Slider
        min={0}
        max={300}
        step={1}
        value={[entry.volume]}
        onValueChange={([v]) => onVolumeChange(entry.id, v)}
      />
    </div>
  );
});
