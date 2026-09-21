import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnlineManager } from './OnlineManager';
import { SideNav } from './SideNav';

export function StoreLayout() {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="sticky top-0 z-40 hidden h-screen w-[17.5rem] shrink-0 border-r border-graphite/10 lg:flex xl:w-[18.5rem]">
        <SideNav className="w-full" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <OnlineManager />
      </div>
    </div>
  );
}
