export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const BY_CODE: Record<string, string> = {
  unauthorized: "Потрібно увійти в акаунт.",
  forbidden: "Недостатньо прав.",
  not_found: "Нічого не знайдено.",
  conflict: "Дію неможливо виконати: стан змінився (наприклад, місця вже зайняті).",
  business_rule_violation: "Дію неможливо виконати за правилами сервісу.",
  feature_unavailable: "Ця функція ще не налаштована.",
  upstream_unavailable: "Цей блок тимчасово недоступний.",
  internal_error: "Щось пішло не так. Спробуйте пізніше.",
  validation_error: "Перевірте правильність введених даних.",
  network_error: "Немає зв'язку з сервером.",
};

/** User-facing text. Server `message` is English, so we map by code and only fall back to it. */
export function messageFor(e: unknown): string {
  if (e instanceof ApiError) return BY_CODE[e.code] ?? e.message;
  return BY_CODE.internal_error;
}
