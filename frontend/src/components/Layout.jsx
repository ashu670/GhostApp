import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import "./Layout.css";

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const MoreIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="19" cy="12" r="1"></circle>
        <circle cx="5" cy="12" r="1"></circle>
    </svg>
);

export default function Layout() {
    const [isLeftOpen, setIsLeftOpen] = useState(false);
    const [isRightOpen, setIsRightOpen] = useState(false);

    const closeDrawers = () => {
        setIsLeftOpen(false);
        setIsRightOpen(false);
    };

    return (
        <div className="layout-container">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="mobile-header">
                <button className="mobile-header-btn" onClick={() => setIsLeftOpen(true)}>
                    <MenuIcon />
                </button>
                <div className="mobile-header-brand">GhostApp</div>
                <button className="mobile-header-btn" onClick={() => setIsRightOpen(true)}>
                    <MoreIcon />
                </button>
            </div>

            {/* Mobile Overlay */}
            {(isLeftOpen || isRightOpen) && (
                <div className="mobile-overlay" onClick={closeDrawers}></div>
            )}

            <Sidebar isOpen={isLeftOpen} onClose={closeDrawers} />

            <main className="layout-main">
                <Outlet />
            </main>

            <RightSidebar isOpen={isRightOpen} onClose={closeDrawers} />
        </div>
    );
}
