import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { sendMessage } from '@/lib/utils';
import {
  extractChannelUrl,
  extractDomain,
  isSpecialDomain,
} from '@/utils/domain';
import { volumeEntries, type VolumeEntry } from '@/utils/storage';

const formSchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  channelUrl: z.string().optional(),
  volume: z.number().min(0).max(300),
});

type FormValues = z.infer<typeof formSchema>;

export function VolumeForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: '',
      channelUrl: '',
      volume: 100,
    },
  });

  const [saved, setSaved] = React.useState(false);
  const activeTabIdRef = React.useRef<number | undefined>(undefined);

  const watchedDomain = form.watch('domain');
  const showChannelUrl = isSpecialDomain(watchedDomain);

  // On mount: auto-detect active tab domain + channel
  React.useEffect(() => {
    browser.tabs
      .query({ active: true, currentWindow: true })
      .then(async ([tab]) => {
        if (!tab?.url) return;
        activeTabIdRef.current = tab.id;
        const domain = extractDomain(tab.url);
        const channelUrl = extractChannelUrl(tab.url);

        form.setValue('domain', domain);
        if (channelUrl) {
          form.setValue('channelUrl', channelUrl);
        }

        // Pre-fill volume from existing saved entry
        const entries = await volumeEntries.getValue();
        const existing = entries.find(
          (e) =>
            e.domain === domain && (e.channelUrl ?? '') === (channelUrl ?? ''),
        );
        if (existing) {
          form.setValue('volume', existing.volume);
        }
      });
  }, [form]);

  async function onSubmit(values: FormValues) {
    const entries = await volumeEntries.getValue();
    const channelUrl = showChannelUrl
      ? values.channelUrl || undefined
      : undefined;

    const newEntry: VolumeEntry = {
      id: crypto.randomUUID(),
      domain: values.domain,
      volume: values.volume,
      channelUrl,
    };

    const idx = entries.findIndex(
      (e) =>
        e.domain === values.domain &&
        (e.channelUrl ?? '') === (channelUrl ?? ''),
    );

    const updated =
      idx >= 0
        ? entries.map((e, i) =>
            i === idx ? { ...e, volume: values.volume, channelUrl } : e,
          )
        : [...entries, newEntry];

    await volumeEntries.setValue(updated);

    if (activeTabIdRef.current !== undefined) {
      await sendMessage(activeTabIdRef.current, {
        type: 'SET_VOLUME',
        gain: values.volume / 100,
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const volumeValue = form.watch('volume');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-4'>
        <h2 className='text-lg font-medium'>Volume Settings</h2>

        <FormField
          control={form.control}
          name='domain'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain</FormLabel>
              <FormControl>
                <Input placeholder='e.g. www.youtube.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showChannelUrl && (
          <FormField
            control={form.control}
            name='channelUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Channel URL</FormLabel>
                <FormControl>
                  <Input placeholder='e.g. /@mkbhd' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name='volume'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel>Volume</FormLabel>
                <span className='text-xs font-medium tabular-nums text-foreground'>
                  {volumeValue}%
                </span>
              </div>
              <FormControl>
                <Slider
                  min={0}
                  max={300}
                  step={1}
                  value={[field.value]}
                  onValueChange={([v]) => {
                    field.onChange(v);
                    if (activeTabIdRef.current !== undefined) {
                      sendMessage(activeTabIdRef.current, {
                        type: 'SET_VOLUME',
                        gain: v / 100,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full' size='sm'>
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
