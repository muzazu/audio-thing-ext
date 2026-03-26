import logo from '/logo.svg';
import { AudioLinesIcon, BookmarkIcon, Settings2Icon } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConfigList } from './components/ConfigList';
import { Settings } from './components/Settings';
import { VolumeForm } from './components/VolumeForm';

function App() {
  return (
    <div className='flex w-[320px] h-130 flex-col bg-background'>
      <div className='p-4 mb-2 shrink-0 flex items-center gap-2 bg-radial-[at_50%_75%] from-slate-500 to-slate-800'>
        <img src={logo} className='w-8 h-auto' alt='Audio Thing Logo' />
        <h1 className='text-xl'>Audio Thing</h1>
      </div>
      <Tabs
        defaultValue='volume'
        className='flex min-h-0 flex-1 flex-col w-full'
      >
        <TabsContent value='volume' className='flex-1 overflow-y-auto'>
          <VolumeForm />
        </TabsContent>
        <TabsContent value='saved' className='flex-1 overflow-hidden'>
          <ConfigList />
        </TabsContent>
        <TabsContent value='setting' className='flex-1 overflow-y-auto'>
          <Settings />
        </TabsContent>
        <TabsList className='w-full py-2 h-auto! shrink-0'>
          <TabsTrigger value='volume' className='py-4 rounded-full'>
            <AudioLinesIcon className='size-4 mr-1' />
            Volume
          </TabsTrigger>
          <TabsTrigger value='saved' className='py-4 rounded-full'>
            <BookmarkIcon className='size-4 mr-1' />
            Saved
          </TabsTrigger>
          <TabsTrigger value='setting' className='py-4 rounded-full'>
            <Settings2Icon className='size-4 mr-1' />
            Settings
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}

export default App;
