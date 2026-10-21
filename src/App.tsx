import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bus, 
  Search, 
  Bell, 
  SlidersHorizontal, 
  Smartphone, 
  RefreshCw, 
  Download,
  Palette
} from 'lucide-react';

import { 
  SavedRoute, 
  BusServiceArrival, 
  NextBusArrival, 
  LeaveCalculation, 
  WeatherInfo,
  ThemePalette
} from './types/transit';

import { 
  DEFAULT_SAVED_ROUTES, 
  STORAGE_KEYS, 
  calculateDistanceMeters, 
  calculateWalkMinutes, 
  calculateLeaveStatus, 
  generateRealtimeArrivals, 
  getWeatherForLocation 
} from './utils/transitUtils';

import { LocationBar } from './components/LocationBar';
import { WeatherWidget } from './components/WeatherWidget';
import { LiveActivityBanner } from './components/LiveActivityBanner';
import { SavedRoutesView } from './components/SavedRoutesView';
import { RoutePeekModal } from './components/RoutePeekModal';
import { SearchAndAddModal } from './components/SearchAndAddModal';
import { WidgetsModal } from './components/WidgetsModal';
import { NotificationSettingsSheet } from './components/NotificationSettingsSheet';
import { EditBusesModal } from './components/EditBusesModal';
import { PWAInstallSheet } from './components/PWAInstallSheet';
import { NotificationBanner, ToastNotification } from './components/NotificationBanner';

export default function App() {
  // Current user GPS / simulated location
  const [currentLocationName, setCurrentLocationName] = useState('Dhoby Ghaut / Orchard (Central)');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 1.2993,
    lng: 103.8453
  });
  const [isGpsActive, setIsGpsActive] = useState(false);

  // Saved Routes state
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_ROUTES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return DEFAULT_SAVED_ROUTES;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_ROUTES, JSON.stringify(savedRoutes));
    } catch (e) {
      // ignore
    }
  }, [savedRoutes]);

  // Weather state
  const [weather, setWeather] = useState<WeatherInfo>(() =>
    getWeatherForLocation(userCoords.lat, userCoords.lng)
  );

  // Real-time arrivals mapping: [busStopCode][serviceNo] -> BusServiceArrival
  const [arrivalsData, setArrivalsData] = useState<Record<string, Record<string, BusServiceArrival>>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, setLastRefreshedAt] = useState<Date>(new Date());

  // Preferences & Settings
  const [noticeMinutes, setNoticeMinutes] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rainAlertEnabled, setRainAlertEnabled] = useState(true);
  const [walkingSpeed, setWalkingSpeed] = useState<'slow' | 'normal' | 'brisk'>('normal');
  const [bufferMinutes, setBufferMinutes] = useState(1);
  const [lowDataMode, setLowDataMode] = useState(false);
  const [ltaApiKey, setLtaApiKey] = useState('LQcDSpOhQGyKlvfSVGEg9Q==');

  // Theme & Accent Palette state ('pastel' | 'ocean' | 'dark')
  const [theme, setTheme] = useState<ThemePalette>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME) as ThemePalette;
      if (stored && ['pastel', 'ocean', 'dark'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      // ignore
    }
    return 'pastel';
  });

  // Apply data-theme attribute and dark class to documentElement
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const handleCycleTheme = () => {
    setTheme((prev) => {
      const next: ThemePalette = prev === 'pastel' ? 'ocean' : prev === 'ocean' ? 'dark' : 'pastel';
      const label = next === 'pastel' ? 'Blush & Mint' : next === 'ocean' ? 'Ocean Breeze' : 'Midnight Dark';
      showToast('info', 'Palette Changed', `Switched to ${label}`);
      return next;
    });
  };

  // Push notifications state
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [activeDepartureAlerts, setActiveDepartureAlerts] = useState<string[]>([]); // "routeId_serviceNo"

  // Primary active tracked bus for Dynamic Island / Live Activity
  const [primaryBus, setPrimaryBus] = useState<{
    serviceNo: string;
    busStopCode: string;
    busStopName: string;
    leaveCalc: LeaveCalculation;
    nextBus?: NextBusArrival;
  } | null>(null);

  // Modals state
  const [peekRouteParams, setPeekRouteParams] = useState<{ serviceNo: string; busStopCode: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<SavedRoute | null>(null);

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission);
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  // Request push permission
  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          showToast('info', 'Notifications Enabled', 'You will receive departure alerts and rain warnings.');
          return true;
        }
      } catch (e) {
        console.warn('Notification permission request error:', e);
      }
    }
    return false;
  };

  // Sound chime helper
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }, [soundEnabled]);

  // Toast Notification dispatcher
  const showToast = useCallback((type: 'departure' | 'rain' | 'info', title: string, message: string, subtext?: string) => {
    const newToast: ToastNotification = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      subtext,
      timestamp: Date.now()
    };

    setToastNotifications((prev) => [newToast, ...prev.slice(0, 2)]);
    playChime();

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: `${message} ${subtext ? '· ' + subtext : ''}`,
          icon: '/icon.svg'
        });
      } catch (e) {
        // Notification API fallback
      }
    }

    setTimeout(() => {
      setToastNotifications((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  }, [playChime]);

  // Dismiss Toast
  const dismissToast = (id: string) => {
    setToastNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  // Weather update on location coordinate change
  useEffect(() => {
    const updatedWeather = getWeatherForLocation(userCoords.lat, userCoords.lng);
    setWeather(updatedWeather);
  }, [userCoords.lat, userCoords.lng]);

  // Helper to parse live LTA NextBus response
  const parseLtaArrival = (raw: any): NextBusArrival | undefined => {
    if (!raw || !raw.EstimatedArrival) return undefined;
    const arrTime = new Date(raw.EstimatedArrival).getTime();
    if (isNaN(arrTime)) return undefined;
    const diffSec = Math.max(0, Math.round((arrTime - Date.now()) / 1000));
    const diffMin = Math.floor(diffSec / 60);

    return {
      estimatedArrival: raw.EstimatedArrival,
      arrivalMinutes: diffMin,
      arrivalSeconds: diffSec,
      load: (raw.Load as any) || 'SEA',
      feature: (raw.Feature as any) || 'WAB',
      type: (raw.Type as any) || 'DD',
      latitude: raw.Latitude ? parseFloat(raw.Latitude) : undefined,
      longitude: raw.Longitude ? parseFloat(raw.Longitude) : undefined,
      visitNumber: raw.VisitNumber ? parseInt(raw.VisitNumber) : 1
    };
  };

  // Refresh Bus Arrival Data function
  const refreshArrivals = useCallback(async () => {
    setIsRefreshing(true);
    const newArrivals: Record<string, Record<string, BusServiceArrival>> = {};

    for (const route of savedRoutes) {
      const baseArrivals = generateRealtimeArrivals(
        route.busStopCode,
        route.selectedBuses
      );

      try {
        const response = await fetch(
          `/api/lta/bus-arrival?busStopCode=${encodeURIComponent(route.busStopCode)}`,
          {
            headers: {
              'x-lta-account-key': ltaApiKey || 'LQcDSpOhQGyKlvfSVGEg9Q=='
            }
          }
        );

        if (response.ok) {
          const ltaJson = await response.json();
          if (ltaJson.Services && Array.isArray(ltaJson.Services) && ltaJson.Services.length > 0) {
            ltaJson.Services.forEach((svcItem: any) => {
              const svcNo = svcItem.ServiceNo;
              if (route.selectedBuses.includes(svcNo)) {
                const next1 = parseLtaArrival(svcItem.NextBus);
                const next2 = parseLtaArrival(svcItem.NextBus2);
                const next3 = parseLtaArrival(svcItem.NextBus3);

                if (next1) {
                  baseArrivals[svcNo] = {
                    serviceNo: svcNo,
                    operator: svcItem.Operator || (['65', '16', '147', '36', '10'].includes(svcNo) ? 'SBST' : 'SMRT'),
                    inService: true,
                    nextBus: next1,
                    nextBus2: next2,
                    nextBus3: next3
                  };
                }
              }
            });
          }
        }
      } catch (err) {
        // Fallback to baseArrivals seamlessly
      }

      newArrivals[route.busStopCode] = baseArrivals;
    }

    setArrivalsData(newArrivals);
    setLastRefreshedAt(new Date());
    setIsRefreshing(false);
  }, [savedRoutes, ltaApiKey]);

  // Auto-refresh interval
  useEffect(() => {
    refreshArrivals();
    const intervalMs = lowDataMode ? 20000 : 10000;
    const interval = setInterval(refreshArrivals, intervalMs);
    return () => clearInterval(interval);
  }, [refreshArrivals, lowDataMode]);

  // Update Primary Bus for Live Activity
  useEffect(() => {
    if (savedRoutes.length === 0) {
      setPrimaryBus(null);
      return;
    }

    const firstRoute = savedRoutes[0];
    const stopArrivals = arrivalsData[firstRoute.busStopCode];
    const firstSvc = firstRoute.selectedBuses[0];

    if (stopArrivals && firstSvc) {
      const arrInfo = stopArrivals[firstSvc];
      const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, firstRoute.lat, firstRoute.lng);
      const walkMins = calculateWalkMinutes(dist, walkingSpeed, firstRoute.manualWalkMinutes);
      const leaveCalc = calculateLeaveStatus(
        firstSvc,
        firstRoute.busStopCode,
        arrInfo?.nextBus,
        arrInfo?.nextBus2,
        walkMins,
        bufferMinutes
      );

      setPrimaryBus({
        serviceNo: firstSvc,
        busStopCode: firstRoute.busStopCode,
        busStopName: firstRoute.busStopName,
        leaveCalc,
        nextBus: arrInfo?.nextBus
      });
    }
  }, [savedRoutes, arrivalsData, userCoords, walkingSpeed, bufferMinutes]);

  // Check active departure alerts & notify user
  useEffect(() => {
    if (activeDepartureAlerts.length === 0) return;

    activeDepartureAlerts.forEach((alertKey) => {
      const [routeId, serviceNo] = alertKey.split('_');
      const route = savedRoutes.find((r) => r.id === routeId);
      if (!route) return;

      const stopArrivals = arrivalsData[route.busStopCode];
      const arrInfo = stopArrivals?.[serviceNo];
      if (!arrInfo?.nextBus) return;

      const dist = calculateDistanceMeters(userCoords.lat, userCoords.lng, route.lat, route.lng);
      const walkMins = calculateWalkMinutes(dist, walkingSpeed, route.manualWalkMinutes);
      const leaveCalc = calculateLeaveStatus(
        serviceNo,
        route.busStopCode,
        arrInfo.nextBus,
        arrInfo.nextBus2,
        walkMins,
        bufferMinutes
      );

      if (leaveCalc.leaveInMinutes <= noticeMinutes && leaveCalc.leaveInMinutes >= 0) {
        showToast(
          'departure',
          `Departure Notice: Bus ${serviceNo}`,
          `Leave now in ${leaveCalc.leaveInMinutes} mins! Bus arrives in ${arrInfo.nextBus.arrivalMinutes}m.`,
          `Walking time: ${walkMins}m · Leave by ${leaveCalc.leaveByTimeFormatted}`
        );
        setActiveDepartureAlerts((prev) => prev.filter((k) => k !== alertKey));
      }
    });
  }, [arrivalsData, activeDepartureAlerts, noticeMinutes, savedRoutes, userCoords, walkingSpeed, bufferMinutes, showToast]);

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          setCurrentLocationName('GPS Live Location');
          setIsGpsActive(true);
          showToast('info', 'Location Updated', 'Using live GPS coordinates.');
        },
        () => {
          setUserCoords({ lat: 1.2993, lng: 103.8453 });
          setCurrentLocationName('Dhoby Ghaut / Orchard (GPS Mode)');
          setIsGpsActive(true);
          showToast('info', 'GPS Active', 'Defaulted to Central district.');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const handleSelectPreset = (name: string, lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setCurrentLocationName(name);
    setIsGpsActive(false);
  };

  const handleToggleDepartureAlert = (route: SavedRoute, serviceNo: string, leaveCalc: LeaveCalculation) => {
    const key = `${route.id}_${serviceNo}`;
    if (activeDepartureAlerts.includes(key)) {
      setActiveDepartureAlerts((prev) => prev.filter((k) => k !== key));
      showToast('info', 'Alert Cancelled', `Alert for Bus ${serviceNo} deactivated.`);
    } else {
      setActiveDepartureAlerts((prev) => [...prev, key]);
      showToast(
        'departure',
        `Alert Armed: Bus ${serviceNo}`,
        `We will notify you ${noticeMinutes} mins before your leave-by deadline.`,
        `Walk: ${leaveCalc.walkingMinutes} mins`
      );
    }
  };

  const handleToggleRainAlert = () => {
    const nextState = !rainAlertEnabled;
    setRainAlertEnabled(nextState);
    if (nextState) {
      showToast('rain', 'Rain Alert Active', 'You will be alerted before tropical rain begins.');
    } else {
      showToast('info', 'Rain Alert Off', 'Pre-rain alerts disabled.');
    }
  };

  const handleTestRainNotification = () => {
    showToast(
      'rain',
      'Rain Alert: Rain Incoming ⛈️',
      'Tropical shower detected in Central area within ~40 minutes.',
      'Bring an umbrella before heading to your bus stop! ☂️'
    );
  };

  const handleTogglePinRoute = (routeId: string) => {
    setSavedRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, isPinned: !r.isPinned } : r))
    );
  };

  const handleDeleteRoute = (routeId: string) => {
    setSavedRoutes((prev) => prev.filter((r) => r.id !== routeId));
    showToast('info', 'Stop Removed', 'Bus stop removed.');
  };

  const handleSaveNewRoute = (newRoute: SavedRoute) => {
    setSavedRoutes((prev) => [newRoute, ...prev]);
    showToast('info', 'Route Saved', `Now tracking ${newRoute.selectedBuses.join(', ')} at ${newRoute.busStopName}.`);
  };

  const handleUpdateRoute = (updated: SavedRoute) => {
    setSavedRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    showToast('info', 'Updated', `Updated preferences for ${updated.busStopName}.`);
  };

  const handleSelectPrimaryBus = (
    serviceNo: string,
    busStopCode: string,
    busStopName: string,
    leaveCalc: LeaveCalculation,
    nextBus?: NextBusArrival
  ) => {
    setPrimaryBus({
      serviceNo,
      busStopCode,
      busStopName,
      leaveCalc,
      nextBus
    });
    showToast('info', 'Live Activity Updated', `Bus ${serviceNo} pinned to top banner.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F7] via-[#FAF7FF] to-[#F0FDF8] text-slate-800 flex flex-col antialiased relative overflow-x-hidden selection:bg-pink-200 selection:text-pink-900">
      {/* Studio Lighting Ambient Glow Orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 bg-pink-200/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-[20%] right-[-120px] w-96 h-96 bg-purple-200/35 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] left-[20%] w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Toast Notifications */}
      <NotificationBanner
        notifications={toastNotifications}
        onDismiss={dismissToast}
      />

      {/* Cute Claymorphic Header */}
      <header className="sticky top-0 z-40 px-3 sm:px-6 py-3 pt-safe">
        <div className="max-w-5xl mx-auto clay-card px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Wordmark & Mascot */}
          <a href="/" className="text-base sm:text-lg font-black tracking-tight text-slate-800 whitespace-nowrap shrink-0 flex items-center gap-2.5">
            <span className="w-9 h-9 clay-bus-mint flex items-center justify-center font-black shadow-md">
              <Bus className="w-5 h-5 text-white stroke-[2.5]" />
            </span>
            <span className="font-extrabold">
              Can Catch <span className="text-pink-500">Not?</span> <span className="text-sm">✨</span>
            </span>
          </a>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => setIsWidgetsModalOpen(true)}
              className="px-3.5 py-2 rounded-full clay-pill-white text-slate-700 hover:text-purple-600 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <span>iOS Widgets</span>
              <span className="text-[10px] clay-badge-lavender px-1.5 py-0.2">iOS</span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3.5 py-2 rounded-full clay-pill-white text-slate-700 hover:text-pink-600 transition-colors whitespace-nowrap"
            >
              Departure Alerts
            </button>
            <button
              onClick={refreshArrivals}
              className="px-3.5 py-2 rounded-full clay-pill-white text-slate-700 hover:text-emerald-600 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : 'text-slate-400'}`} />
              <span>Sync ETAs</span>
            </button>
          </nav>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-4 py-2.5 clay-btn-mint font-extrabold text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Search Buses</span>
              <span className="sm:hidden">Search</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Preferences"
              className="w-9 h-9 clay-icon-btn flex items-center justify-center text-slate-600 hover:text-pink-600 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Grid Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-6 pb-28 relative z-10">
        {/* Bento Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Live Activity / Dynamic Island: 7 columns */}
          <div className="lg:col-span-7 space-y-4">
            {primaryBus && (
              <LiveActivityBanner
                busServiceNo={primaryBus.serviceNo}
                busStopName={primaryBus.busStopName}
                busStopCode={primaryBus.busStopCode}
                leaveCalc={primaryBus.leaveCalc}
                nextBus={primaryBus.nextBus}
                umbrellaNeeded={weather.umbrellaAdvice.bringUmbrella}
                onOpenWidgetsModal={() => setIsWidgetsModalOpen(true)}
              />
            )}

            <LocationBar
              currentLocationName={currentLocationName}
              isGpsActive={isGpsActive}
              onUseGps={handleUseGps}
              onSelectPreset={handleSelectPreset}
              currentCoords={userCoords}
            />
          </div>

          {/* Weather & 1-Hour Forecast Module: 5 columns */}
          <div className="lg:col-span-5">
            <WeatherWidget
              weather={weather}
              isRainAlertEnabled={rainAlertEnabled}
              onToggleRainAlert={handleToggleRainAlert}
              onTestRainNotification={handleTestRainNotification}
            />
          </div>
        </div>

        {/* Saved Routes & Proximity Filter Section */}
        <div className="pt-1">
          <SavedRoutesView
            savedRoutes={savedRoutes}
            userCoords={userCoords}
            arrivalsData={arrivalsData}
            activeDepartureAlerts={activeDepartureAlerts}
            onToggleDepartureAlert={handleToggleDepartureAlert}
            onPeekRoute={(svc, stop) => setPeekRouteParams({ serviceNo: svc, busStopCode: stop })}
            onEditBusesForStop={(route) => setRouteToEdit(route)}
            onDeleteRoute={handleDeleteRoute}
            onTogglePinRoute={handleTogglePinRoute}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectPrimaryBus={handleSelectPrimaryBus}
          />
        </div>
      </main>

      {/* Mobile Floating Clay Dock Tab Bar */}
      <footer className="fixed bottom-3 left-4 right-4 z-40 pb-safe md:hidden">
        <div className="max-w-md mx-auto clay-card p-2 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-0.5 text-emerald-600 font-extrabold py-1.5 px-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            <Bus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px]">Track</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-pink-600 font-bold py-1.5 px-3 rounded-full hover:bg-pink-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px]">Search</span>
          </button>

          <button
            onClick={() => setIsWidgetsModalOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-purple-600 font-bold py-1.5 px-3 rounded-full hover:bg-purple-50 transition-colors"
          >
            <Smartphone className="w-5 h-5" />
            <span className="text-[10px]">Widgets</span>
          </button>

          <button
            onClick={() => setIsPWAInstallOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-emerald-600 font-bold py-1.5 px-3 rounded-full hover:bg-emerald-50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="text-[10px]">Install</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center gap-0.5 text-slate-500 hover:text-purple-600 font-bold py-1.5 px-3 rounded-full hover:bg-purple-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="text-[10px]">Alerts</span>
          </button>
        </div>
      </footer>

      {/* Route Peek Modal */}
      {peekRouteParams && (
        <RoutePeekModal
          serviceNo={peekRouteParams.serviceNo}
          currentStopCode={peekRouteParams.busStopCode}
          onClose={() => setPeekRouteParams(null)}
        />
      )}

      {/* Search & Add Modal */}
      {isSearchOpen && (
        <SearchAndAddModal
          onClose={() => setIsSearchOpen(false)}
          onSaveRoute={handleSaveNewRoute}
          existingSavedCodes={savedRoutes.map((r) => r.busStopCode)}
        />
      )}

      {/* Edit Buses for Stop Modal */}
      {routeToEdit && (
        <EditBusesModal
          route={routeToEdit}
          onClose={() => setRouteToEdit(null)}
          onSave={handleUpdateRoute}
        />
      )}

      {/* Widgets Modal */}
      {isWidgetsModalOpen && (
        <WidgetsModal
          onClose={() => setIsWidgetsModalOpen(false)}
          serviceNo={primaryBus?.serviceNo || '65'}
          busStopName={primaryBus?.busStopName || 'Dhoby Ghaut Stn'}
          busStopCode={primaryBus?.busStopCode || '08057'}
          leaveCalc={
            primaryBus?.leaveCalc || {
              serviceNo: '65',
              busStopCode: '08057',
              busArrivalMinutes: 8,
              walkingMinutes: 4,
              bufferMinutes: 1,
              leaveInMinutes: 3,
              leaveInSeconds: 180,
              leaveByTimeFormatted: '1:14 PM',
              urgency: 'soon',
              urgencyLabel: 'Pack up soon',
              nextOption: {
                arrivalMinutes: 18,
                leaveInMinutes: 13,
                leaveByTimeFormatted: '1:24 PM'
              }
            }
          }
          nextBus={primaryBus?.nextBus}
          weather={weather}
        />
      )}

      {/* Settings Sheet */}
      {isSettingsOpen && (
        <NotificationSettingsSheet
          onClose={() => setIsSettingsOpen(false)}
          noticeMinutes={noticeMinutes}
          onChangeNoticeMinutes={setNoticeMinutes}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          rainAlertEnabled={rainAlertEnabled}
          onToggleRainAlert={handleToggleRainAlert}
          walkingSpeed={walkingSpeed}
          onChangeWalkingSpeed={setWalkingSpeed}
          bufferMinutes={bufferMinutes}
          onChangeBufferMinutes={setBufferMinutes}
          lowDataMode={lowDataMode}
          onToggleLowDataMode={() => setLowDataMode(!lowDataMode)}
          ltaApiKey={ltaApiKey}
          onSaveLtaApiKey={setLtaApiKey}
          onRequestPushPermission={handleRequestPushPermission}
          pushPermissionState={pushPermission}
        />
      )}

      {/* PWA Install Sheet */}
      {isPWAInstallOpen && (
        <PWAInstallSheet
          onClose={() => setIsPWAInstallOpen(false)}
          isInstallable={!!deferredPrompt}
          onTriggerInstall={async () => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              const choice = await deferredPrompt.userChoice;
              if (choice.outcome === 'accepted') {
                showToast('info', 'Can Catch Not? Installed', 'App installed to your home screen.');
              }
              setDeferredPrompt(null);
            }
          }}
        />
      )}
    </div>
  );
}
