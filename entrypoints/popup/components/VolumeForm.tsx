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
import { useActiveTab } from '@/hooks/useActiveTab';
import { useSavedIndicator } from '@/hooks/useSavedIndicator';
import { sendMessage } from '@/lib/utils';
import { isSpecialDomain } from '@/utils/domain';
import { upsertVolumeEntry } from '@/utils/volume-entries';

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

  const { saved, markSaved } = useSavedIndicator();
  const activeTab = useActiveTab();

  const watchedDomain = form.watch('domain');
  const showChannelUrl = isSpecialDomain(watchedDomain);

  // Sync active tab info into form fields when it resolves
  React.useEffect(() => {
    if (!activeTab.domain) return;
    form.setValue('domain', activeTab.domain);
    if (activeTab.channelUrl) {
      form.setValue('channelUrl', activeTab.channelUrl);
    }
    if (activeTab.existingEntry) {
      form.setValue('volume', activeTab.existingEntry.volume);
    }
  }, [form, activeTab]);

  async function onSubmit(values: FormValues) {
    const channelUrl = showChannelUrl
      ? values.channelUrl || undefined
      : undefined;

    await upsertVolumeEntry(values.domain, values.volume, channelUrl);

    if (activeTab.tabId !== undefined) {
      await sendMessage(activeTab.tabId, {
        type: 'SET_VOLUME',
        gain: values.volume / 100,
      });
    }

    markSaved();
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
                <Input
                  data-testid='domain-input'
                  placeholder='e.g. www.youtube.com'
                  {...field}
                />
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
                  <Input
                    data-testid='channel-url-input'
                    placeholder='e.g. /@mkbhd'
                    {...field}
                  />
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
                  data-testid='volume-slider'
                  onValueChange={([v]) => {
                    field.onChange(v);
                    if (activeTab.tabId !== undefined) {
                      sendMessage(activeTab.tabId, {
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

        <Button
          type='submit'
          className='w-full rounded-full mt-2'
          size={'lg'}
          data-testid='save-button'
        >
          {saved ? 'Saved!' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
