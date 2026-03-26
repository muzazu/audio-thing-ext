import logo from '/logo.svg';
import { AudioLinesIcon, Settings2Icon } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConfigList } from './components/ConfigList';
import { VolumeForm } from './components/VolumeForm';

function App() {
  return (
    <div className='flex w-[320px] h-130 flex-col bg-background'>
      <div className='mx-4 mt-4 mb-2 shrink-0'>
        <h1>
          <img src={logo} className='w-8 h-auto' alt='Audio Thing Logo' />
        </h1>
      </div>
      <Tabs
        defaultValue='volume'
        className='flex min-h-0 flex-1 flex-col w-full'
      >
        <TabsContent value='volume' className='flex-1 overflow-y-auto'>
          <VolumeForm />
        </TabsContent>
        <TabsContent value='config' className='flex-1 overflow-hidden'>
          <ConfigList />
        </TabsContent>
        <TabsList className='w-full py-2 h-auto! shrink-0'>
          <TabsTrigger value='volume' className='py-4 rounded-full'>
            <AudioLinesIcon className='size-4 mr-1' />
            Volume
          </TabsTrigger>
          <TabsTrigger value='config' className='py-4 rounded-full'>
            <Settings2Icon className='size-4 mr-1' />
            Config
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default App;
