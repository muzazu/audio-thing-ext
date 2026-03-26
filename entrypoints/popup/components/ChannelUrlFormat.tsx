import * as React from 'react';

/**
 * If the channel URL contains multiple segments, only show the last one.
 */
export const ChannelUrlFormat = React.memo(function ChannelUrlFormat({
  channelUrl,
}: {
  channelUrl: string;
}) {
  const display = channelUrl.includes('/')
    ? `/${channelUrl.split('/').filter(Boolean).slice(-1).join('/')}`
    : channelUrl;

  return (
    <span className='truncate text-[11px] text-muted-foreground'>
      {display}
    </span>
  );
});
