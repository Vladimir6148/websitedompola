import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnlineManager } from './OnlineManager';
import { SideNav } from './SideNav';

export function StoreLayout() {
  return (
    <div className="min-h-screen bg-[#eef2ee]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] bg-white shadow-[0_0_0_1px_rgba(28,31,29,0.06)] lg:min-h-screen">
        <aside className="sticky top-0 z-40 hidden h-screen w-[15.5rem] shrink-0 border-r border-graphite/10 xl:w-[16.5rem] lg:flex">
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
    </div>
  );
}
