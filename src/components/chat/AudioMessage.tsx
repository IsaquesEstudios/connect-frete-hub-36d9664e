import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

interface Props {
  src: string;
  mine: boolean;
}

function fmt(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Barras estáticas que simulam waveform (estilo WhatsApp).
const BARS = [3, 6, 10, 14, 9, 5, 8, 12, 16, 13, 7, 4, 9, 15, 11, 6, 10, 14, 8, 5, 3, 6, 11, 9, 12, 7, 4, 8, 13, 10];

export function AudioMessage({ src, mine }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onLoaded = () => setDuration(a.duration || 0);
    const onTime = () => setCurrent(a.currentTime || 0);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    // Alguns blobs (webm) não expõem duration imediatamente — força
    if (a.readyState >= 1) onLoaded();
    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [src]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = Math.max(0, Math.min(duration, ratio * duration));
    setCurrent(a.currentTime);
  }

  const progress = duration > 0 ? current / duration : 0;
  const shownTime = playing || current > 0 ? current : duration;

  // Cores: no bubble mine (primary) usa branco; no card claro usa primary.
  const activeColor = mine ? "bg-white" : "bg-primary";
  const inactiveColor = mine ? "bg-white/35" : "bg-primary/25";
  const btnBg = mine ? "bg-white text-primary" : "bg-primary text-primary-foreground";
  const timeColor = mine ? "text-white/80" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 min-w-[220px] py-1">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition hover:scale-105 ${btnBg}`}
        aria-label={playing ? "Pausar" : "Reproduzir"}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>

      <div className="flex flex-col flex-1 min-w-0">
        <div
          onClick={seek}
          className="flex items-center gap-[2px] h-8 cursor-pointer select-none"
        >
          {BARS.map((h, i) => {
            const filled = i / BARS.length <= progress;
            return (
              <span
                key={i}
                className={`w-[3px] rounded-full transition-colors ${filled ? activeColor : inactiveColor}`}
                style={{ height: `${h + 6}px` }}
              />
            );
          })}
        </div>
        <span className={`text-[10px] tabular-nums mt-0.5 ${timeColor}`}>
          {fmt(shownTime)}
        </span>
      </div>
    </div>
  );
}
