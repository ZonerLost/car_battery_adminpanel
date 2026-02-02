/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiBell, FiMenu } from "react-icons/fi";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

const Topbar = ({ onMenuClick }) => {
  const [now, setNow] = useState(new Date());
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "n1",
      title: "New feedback received",
      body: "Battery location reported for Toyota Corolla 2015.",
      time: "2h ago",
      read: false,
    },
    {
      id: "n2",
      title: "Report approved",
      body: "Report RPT-1021 was approved.",
      time: "1d ago",
      read: true,
    },
  ]);
  const notifRef = useRef(null);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const titles = {
      "/": "Dashboard",
      "/car-database": "Car Database",
      "/feedback-reports": "Feedback & Reports",
      "/diagram-management": "Diagram Management",
      "/settings": "Settings",
    };
    return titles[location.pathname] || "Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(id);
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!notifRef.current) return;
      if (!notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };

    if (notifOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notifOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="px-3 sm:px-4 md:px-6 py-3 flex flex-wrap items-center gap-3">
        {/* Left: mobile menu + page title */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 hover:bg-slate-100"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <FiMenu className="text-slate-700" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Overview
            </span>
            <span className="text-base font-semibold text-slate-900 leading-tight">
              {pageTitle}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full sm:w-auto">
          {/* Date pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
            <span className="text-xs font-medium text-slate-700">
              {formatDate(now)}
            </span>
          </div>

          {/* Time pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50">
            <span className="text-xs font-medium text-slate-700">
              {formatTime(now)}
            </span>
            <span className="text-[10px] text-slate-500">GMT+5</span>
          </div>

          {/* Notification button + dropdown */}
          {/* <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((s) => !s)}
              aria-expanded={notifOpen}
              aria-label="Open notifications"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 relative"
            >
              <FiBell className="text-slate-700 text-lg" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-72 overflow-auto rounded-lg shadow-lg bg-white border border-slate-200 z-50">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Notifications
                  </h4>
                  <button
                    onClick={markAllRead}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Mark all read
                  </button>
                </div>

                <ul className="divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <li className="p-4 text-sm text-slate-500">
                      No notifications
                    </li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n.id}
                        className={`p-3 hover:bg-slate-50 ${
                          n.read ? "" : "bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {n.title}
                        </div>
                        <div className="text-xs text-slate-500">{n.body}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {n.time}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div> */}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
