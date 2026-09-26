import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const ROOM_TABS = ["standings", "place-bets", "info"];
const DEFAULT_TAB = "standings";

/**
 * Room tab state mirrored to a `tab` query param.
 *
 * The active tab is initialised from the URL so a shared/bookmarked link
 * reopens the same tab; unknown values fall back to Standings. Tab changes are
 * written back with `replace` so switching tabs stays out of the browser
 * history stack, and the default tab omits the param to keep URLs clean. An
 * effect keeps state in sync when the param changes externally (back/forward,
 * or opening a shared link after mount).
 */
const useRoomTabs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const resolvedTab = ROOM_TABS.includes(tabParam) ? tabParam : DEFAULT_TAB;

  const [activeTab, setActiveTab] = useState(resolvedTab);

  const handleTabChange = (key) => {
    setActiveTab(key);
    const next = new URLSearchParams(searchParams);
    if (key === DEFAULT_TAB) {
      next.delete("tab");
    } else {
      next.set("tab", key);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setActiveTab((prev) => (prev === resolvedTab ? prev : resolvedTab));
  }, [resolvedTab]);

  return { activeTab, handleTabChange };
};

export default useRoomTabs;
