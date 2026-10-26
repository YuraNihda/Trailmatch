import { useState } from "react";
import { NO_PHOTO } from "../../shared/blocks";
import { glass } from "../../shared/styles";

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const list = photos.length ? photos : [NO_PHOTO];
  const current = list[Math.min(idx, list.length - 1)];

  return (
    <div className="space-y-3">
      <div className={glass + " relative h-72 overflow-hidden sm:h-[26rem]"}>
        <img src={current} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>
      {list.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Фото ${i + 1}`}
              aria-current={i === idx}
              className={
                "h-16 w-24 shrink-0 overflow-hidden rounded-2xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 " +
                (i === idx ? "border-cyan-200/80" : "border-white/20 opacity-70 hover:opacity-100")
              }
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}