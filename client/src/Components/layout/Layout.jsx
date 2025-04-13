import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 relative z-10 w-full">
          <main className="flex-1 rwd-p overflow-y-auto min-w-[250px]">
            <div className="max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
