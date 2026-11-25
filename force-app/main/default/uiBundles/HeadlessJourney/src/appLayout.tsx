import "@salesforce-ux/design-system-2/dist/css/bundled/slds2.cosmos.css";
import { useEffect, useState } from "react";
import { ExternalLink, Moon, Mountain, Sun } from "lucide-react";
import headlessToolkitIcon from "./assets/headless-toolkit.jpg";
import { createViewSDK } from "@salesforce/platform-sdk/view";
import { Outlet } from "react-router";
export default function AppLayout() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem("headless-journey-theme");
      if (saved === "dark" || saved === "light") return saved === "dark";
    } catch { /* Storage may be unavailable in an embedded context. */ }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => { void createViewSDK(); }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem("headless-journey-theme", next ? "dark" : "light"); } catch { /* Theme still works for this session. */ }
  };
  return (
    <div className="journey-app">
      <header className="journey-header">
        <div className="journey-header__title">
          <img className="journey-header__icon" src={headlessToolkitIcon} alt="" />
          <h1 className="slds-text-heading_medium">Explore Headless Toolkit Journey</h1>
        </div>
        <div className="journey-header__actions">
        <button type="button" className="slds-button slds-button_neutral journey-theme-button"
          aria-label={`Current theme: ${dark ? "Dark" : "Light"}. Switch to ${dark ? "Light" : "Dark"} theme`}
          title={`Switch to ${dark ? "Light" : "Dark"} Theme`}
          onClick={toggleTheme}>
          {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>
        <a className="slds-button slds-button_brand journey-open-button" href="https://github.com/forcedotcom/partner-ecosystem-agentic-kit" target="_blank" rel="noopener noreferrer">
          PEAK <Mountain size={16} aria-hidden="true" />
        </a>
        <a className="slds-button slds-button_brand journey-open-button" href={window.location.href} target="_blank" rel="noopener noreferrer">
          Open <ExternalLink size={16} aria-hidden="true" />
        </a>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
