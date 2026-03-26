import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { appSettings } from '@/utils/storage';

const formSchema = z.object({
  retryCount: z.number().int().min(0).max(20),
  retryDelay: z.number().int().min(100).max(10000),
});

type FormValues = z.infer<typeof formSchema>;

export function Settings() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      retryCount: 1,
      retryDelay: 1000,
    },
  });

  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    appSettings.getValue().then((s) => {
      form.reset(s);
    });
  }, [form]);

  async function onSubmit(values: FormValues) {
    await appSettings.setValue(values);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 p-4'>
        <h2 className='text-lg font-medium'>Injection Settings</h2>

        <FormField
          control={form.control}
          name='retryCount'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retry Count</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={0}
                  max={20}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>
                How many times to retry injecting volume control when no video
                is found yet (0–20).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='retryDelay'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retry Delay (ms)</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={100}
                  max={10000}
                  step={10}
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormDescription>
                Milliseconds to wait between each retry attempt (100–10000).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' className='w-full rounded-full' size={'lg'}>
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </form>
    </Form>
  );
}
