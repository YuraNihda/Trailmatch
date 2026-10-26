import { CheckIcon } from "../../shared/blocks";
import { glass } from "../../shared/styles";

export function InfoList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className={glass + " p-5"}>
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm text-white/75">
        {items.map((i, n) => (
          <li key={n} className="flex gap-2.5">
            <CheckIcon />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}