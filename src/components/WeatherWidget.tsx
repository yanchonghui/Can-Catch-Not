import React from 'react';
import { CloudRain, Sun, Cloud, CloudLightning, Umbrella, Bell, BellRing, Droplets, Wind, Sparkles } from 'lucide-react';
import { WeatherInfo } from '../types/transit';

interface WeatherWidgetProps {
  weather: WeatherInfo;
  isRainAlertEnabled: boolean;
  onToggleRainAlert: () => void;
  onTestRainNotification: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  isRainAlertEnabled,
  onToggleRainAlert,
  onTestRainNotification
}) => {
  const getWeatherIcon = (iconName: string, className: string = 'w-6 h-6') => {
    switch (iconName) {
      case 'thunderstorm':
        return <CloudLightning className={`${className} text-purple-500`} />;
      case 'rain':
        return <CloudRain className={`${className} text-pink-500`} />;
      case 'sun':
        return <Sun className={`${className} text-amber-500`} />;
      case 'cloudy':
      case 'partly-cloudy':
      default:
        return <Cloud className={`${className} text-indigo-400`} />;
    }
  };

  return (
    <div className="clay-card p-4 sm:p-5 space-y-3.5 relative overflow-hidden">
      {/* Studio lighting top-right soft glow highlight */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-200/30 rounded-full blur-2xl pointer-events-none" />

      {/* Current Weather Card Header */}
      <div className="flex items-start gap-3.5">
        {/* Weather Icon 3D Squircle */}
        <div className="w-13 h-13 sm:w-14 sm:h-14 clay-pill-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
          {getWeatherIcon(weather.conditionIcon, 'w-7 h-7 sm:w-8 sm:h-8')}
        </div>

        {/* Temperature & Condition */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-3xl sm:text-4xl font-black font-sans tracking-tight text-slate-800">
              {weather.temperature}
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-500 ml-0.5">°C</span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-full shadow-xs border border-white">
              {weather.condition}
            </span>
          </div>

          {/* Location & Environment Stats */}
          <div className="text-xs font-bold text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-slate-700 font-extrabold">{weather.area}</span>
            <span className="inline-flex items-center gap-1 bg-sky-50/80 text-sky-700 px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-sky-100">
              <Droplets className="w-3 h-3 text-sky-500" />
              <span>{weather.humidity}%</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-50/80 text-purple-700 px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-purple-100">
              <Wind className="w-3 h-3 text-purple-400" />
              <span>{weather.windSpeed}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 1-Hour Forecast Inset Strip */}
      <div className="clay-inset p-3 rounded-[22px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shrink-0 shadow-xs border border-white/60">
            {getWeatherIcon(weather.inOneHour.conditionIcon, 'w-4 h-4')}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black text-purple-600/80 tracking-wider flex items-center gap-1">
              <span>In 1 Hour</span>
              <Sparkles className="w-2.5 h-2.5 text-purple-500" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-black font-sans text-slate-800">
                {weather.inOneHour.temperature}°C
              </span>
              <span className="text-xs text-slate-700 font-bold">
                {weather.inOneHour.condition}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <span className={`text-[10px] sm:text-[11px] font-black px-2.5 py-1 rounded-full shadow-xs whitespace-nowrap ${
            weather.inOneHour.rainProbability >= 50
              ? 'clay-badge-pink'
              : 'clay-badge-mint'
          }`}>
            {weather.inOneHour.rainProbability}% Rain Risk
          </span>
        </div>
      </div>

      {/* Reconfigured Umbrella Guidance & Rain Alert Box: All words fit with generous breathing room */}
      <div className={`p-4 rounded-[26px] transition-all border ${
        weather.umbrellaAdvice.bringUmbrella
          ? 'clay-card-pink border-white'
          : 'clay-card-mint border-white'
      }`}>
        {/* Top Header: Umbrella Icon + Advice Title + Status Badge */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
            weather.umbrellaAdvice.bringUmbrella
              ? 'clay-btn-pink'
              : 'clay-btn-mint'
          }`}>
            <Umbrella className="w-6 h-6 text-white stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="font-black text-slate-800 text-sm sm:text-base leading-tight">
                {weather.umbrellaAdvice.bringUmbrella ? 'Bring an Umbrella! ☂️' : 'No Umbrella Needed ☀️'}
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                weather.umbrellaAdvice.bringUmbrella ? 'clay-badge-pink' : 'clay-badge-mint'
              }`}>
                {weather.umbrellaAdvice.bringUmbrella ? 'Rain Warning' : 'Clear Sky'}
              </span>
            </div>

            {/* Explanatory sentence: Fully visible without any truncation */}
            <p className="text-xs font-bold text-slate-600 mt-1 leading-relaxed break-words">
              {weather.umbrellaAdvice.reason}
            </p>
          </div>
        </div>

        {/* Rain Alert Toggle & Action Strip */}
        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
            <Bell className={`w-3.5 h-3.5 ${isRainAlertEnabled ? 'text-pink-600' : 'text-slate-400'}`} />
            <span>Rain Alerts</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRainAlert}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                isRainAlertEnabled
                  ? 'clay-btn-lavender shadow-md'
                  : 'clay-pill-white text-slate-700 hover:text-purple-600 shadow-xs'
              }`}
            >
              {isRainAlertEnabled ? (
                <>
                  <BellRing className="w-3.5 h-3.5 animate-bounce text-purple-700" />
                  <span>Alert Active</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <span>Enable Alert</span>
                </>
              )}
            </button>

            {isRainAlertEnabled && (
              <button
                onClick={onTestRainNotification}
                className="text-[11px] px-3 py-1.5 rounded-full clay-pill-white text-slate-700 hover:text-pink-600 font-extrabold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Test notification alert"
              >
                Test Alert
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Imminent Rain Notice Banner */}
      {weather.rainAlert.imminent && (
        <div className="text-xs text-pink-900 clay-card-pink p-3.5 rounded-[22px] border border-white flex items-center gap-2.5 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping shrink-0" />
          <span className="font-extrabold leading-relaxed break-words">
            🌧️ Pre-rain notice: Rain shower moving into sector within ~{weather.rainAlert.startsInMinutes} mins!
          </span>
        </div>
      )}
    </div>
  );
};
