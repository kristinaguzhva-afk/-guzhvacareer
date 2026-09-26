const MAX_BODY_BYTES = 20_000;

const LIMITS = Object.freeze({
  name: 80,
  email: 120,
  contact: 100,
  comment: 800,
  selectedService: 120,
  quizAnswer: 200,
  pageUrl: 500,
});

function jsonResponse(body, status, origin = "") {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  return new Response(JSON.stringify(body), { status, headers });
}

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function hasValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function validatePayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Ожидается JSON-объект" };
  }

  const quiz = input.quiz;
  if (!quiz || typeof quiz !== "object" || Array.isArray(quiz)) {
    return { error: "Не заполнены ответы диагностики" };
  }

  const data = {
    name: cleanString(input.name, LIMITS.name),
    email: cleanString(input.email, LIMITS.email).toLowerCase(),
    contact: cleanString(input.contact, LIMITS.contact),
    comment: cleanString(input.comment, LIMITS.comment),
    selectedService: cleanString(input.selectedService, LIMITS.selectedService),
    website: cleanString(input.website, 120),
    consent: input.consent === true,
    pageUrl: cleanString(input.pageUrl, LIMITS.pageUrl),
    quiz: {
      goal: cleanString(quiz.goal, LIMITS.quizAnswer),
      level: cleanString(quiz.level, LIMITS.quizAnswer),
      industry: cleanString(quiz.industry, LIMITS.quizAnswer),
      blocker: cleanString(quiz.blocker, LIMITS.quizAnswer),
    },
  };

  // Honeypot is intentionally treated as a successful no-op by the caller.
  if (data.website) return { data, isBot: true };
  if (data.name.length < 2) return { error: "Укажи имя" };
  if (!hasValidEmail(data.email)) return { error: "Проверь формат email" };
  if (!data.consent) return { error: "Необходимо согласие на обработку данных" };
  if (!data.quiz.goal || !data.quiz.level || !data.quiz.industry || !data.quiz.blocker) {
    return { error: "Ответь на все вопросы диагностики" };
  }
  if (!data.selectedService) return { error: "Не определен рекомендуемый формат" };
  if (data.pageUrl && !/^https?:\/\//i.test(data.pageUrl)) return { error: "Некорректный адрес страницы" };

  return { data, isBot: false };
}

async function hashKey(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatMessage(data, timestamp) {
  const safe = (value, fallback = "Не указано") => escapeHtml(value || fallback);

  return [
    "<b>Новая заявка с сайта Кристины</b>",
    "",
    `<b>Имя:</b> ${safe(data.name)}`,
    `<b>Email:</b> ${safe(data.email)}`,
    `<b>Telegram / телефон:</b> ${safe(data.contact)}`,
    `<b>Комментарий:</b> ${safe(data.comment)}`,
    "",
    `<b>Рекомендованный формат:</b> ${safe(data.selectedService)}`,
    `<b>Цель:</b> ${safe(data.quiz.goal)}`,
    `<b>Уровень:</b> ${safe(data.quiz.level)}`,
    `<b>Отрасль:</b> ${safe(data.quiz.industry)}`,
    `<b>Главный барьер:</b> ${safe(data.quiz.blocker)}`,
    "",
    `<b>Страница:</b> ${safe(data.pageUrl)}`,
    `<b>Время:</b> ${safe(timestamp)}`,
  ].join("\n");
}

async function sendToTelegram(data, env) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error("Worker не настроен: отсутствуют Telegram secrets");
  }

  const timestamp = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "long",
  }).format(new Date());

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: formatMessage(data, timestamp),
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    },
  );

  const result = await telegramResponse.json().catch(() => null);
  if (!telegramResponse.ok || !result?.ok) {
    throw new Error(result?.description || `Telegram API вернул ${telegramResponse.status}`);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = cleanString(env.ALLOWED_ORIGIN, 500);
    const originAllowed = Boolean(allowedOrigin && origin === allowedOrigin);

    if (request.method === "OPTIONS") {
      if (!originAllowed) return jsonResponse({ ok: false, error: "Origin не разрешен" }, 403);
      const headers = new Headers({
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Cache-Control": "no-store",
        "Vary": "Origin",
      });
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST") {
      const response = jsonResponse({ ok: false, error: "Метод не поддерживается" }, 405, originAllowed ? origin : "");
      response.headers.set("Allow", "POST, OPTIONS");
      return response;
    }

    if (!originAllowed) return jsonResponse({ ok: false, error: "Origin не разрешен" }, 403);

    const contentType = request.headers.get("Content-Type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonResponse({ ok: false, error: "Ожидается application/json" }, 400, origin);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ ok: false, error: "Слишком большой запрос" }, 400, origin);
    }

    let input;
    try {
      const bodyText = await request.text();
      if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
        return jsonResponse({ ok: false, error: "Слишком большой запрос" }, 400, origin);
      }
      input = JSON.parse(bodyText);
    } catch {
      return jsonResponse({ ok: false, error: "Некорректный JSON" }, 400, origin);
    }

    const validation = validatePayload(input);
    if (validation.error) return jsonResponse({ ok: false, error: validation.error }, 400, origin);
    if (validation.isBot) return jsonResponse({ ok: true }, 200, origin);

    if (env.LEAD_RATE_LIMITER) {
      const key = await hashKey(validation.data.email);
      const { success } = await env.LEAD_RATE_LIMITER.limit({ key });
      if (!success) {
        return jsonResponse({ ok: false, error: "Слишком много попыток. Попробуй позже" }, 429, origin);
      }
    }

    try {
      await sendToTelegram(validation.data, env);
      return jsonResponse({ ok: true }, 200, origin);
    } catch (error) {
      console.error("Telegram delivery failed", error instanceof Error ? error.message : "Unknown error");
      return jsonResponse({ ok: false, error: "Не удалось доставить заявку" }, 502, origin);
    }
  },
};
