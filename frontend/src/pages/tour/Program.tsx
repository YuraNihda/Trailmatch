import type { TourDetail } from "../../api/types";
import { ChevronIcon, Notice, SectionTitle } from "../../shared/blocks";
import { glass } from "../../shared/styles";

export function Program({ program }: { program: TourDetail["program"] }) {
  return (
    <div>
      <SectionTitle>Програма</SectionTitle>
      {program.length === 0 ? (
        <Notice>Програма скоро з'явиться.</Notice>
      ) : (
        <div className="space-y-3">
          {program.map((d) => (
            <details key={d.day} open={d.day === 1} className={glass + " group"}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:text-base [&::-webkit-details-marker]:hidden">
                <span>День {d.day}. {d.title}</span>
                <ChevronIcon />
              </summary>
              {d.description && (
                <p className="whitespace-pre-line px-6 pb-5 text-sm leading-relaxed text-white/70">{d.description}</p>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}