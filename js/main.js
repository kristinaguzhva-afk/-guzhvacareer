"use strict";

document.documentElement.classList.add("js");

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

window.addEventListener("pageshow", () => {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
});

const SITE_CONFIG = Object.freeze({
  workerEndpoint: "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev",
  formEnabled: false,
});

window.SITE_CONFIG = SITE_CONFIG;

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const header = $("[data-header]");
const menuToggle = $("[data-menu-toggle]");
const menuDrawer = $("[data-menu-drawer]");
const menuBackdrop = $("[data-menu-backdrop]");
const menuClose = $("[data-menu-close]");

function openMenu() {
  if (!menuDrawer) return;
  menuToggle?.setAttribute("aria-expanded", "true");
  menuDrawer.setAttribute("aria-hidden", "false");
  menuDrawer.classList.add("is-open");
  menuBackdrop?.classList.add("is-open");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  if (!menuDrawer) return;
  menuToggle?.setAttribute("aria-expanded", "false");
  menuDrawer.setAttribute("aria-hidden", "true");
  menuDrawer.classList.remove("is-open");
  menuBackdrop?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && menuDrawer) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuDrawer.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menuClose?.addEventListener("click", () => {
    closeMenu();
    menuToggle.focus();
  });

  menuBackdrop?.addEventListener("click", closeMenu);

  $$("a", menuDrawer).forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuDrawer.classList.contains("is-open")) {
      closeMenu();
      menuToggle.focus();
    }
  });
}

let previousScrollY = window.scrollY;
let scrollTicking = false;

function updateHeader() {
  const currentScrollY = window.scrollY;
  const menuIsOpen = menuToggle?.getAttribute("aria-expanded") === "true";
  if (header && !menuIsOpen) {
    header.classList.toggle("is-hidden", currentScrollY > previousScrollY && currentScrollY > 180);
  }
  previousScrollY = currentScrollY;
  scrollTicking = false;
}

window.addEventListener("scroll", () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateHeader);
    scrollTicking = true;
  }
}, { passive: true });

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = $$(".reveal");

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "200px 0px", threshold: 0 });

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 35}ms`;
    revealObserver.observe(item);
  });

  setTimeout(() => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }, 1000);
}

const yearNode = $("[data-year]");
if (yearNode) yearNode.textContent = String(new Date().getFullYear());

const painItems = $$(".pain-item");
const painDialog = $("#pain-dialog");
const painDialogTitle = $("#pain-dialog-title");
const painDialogDescription = $("#pain-dialog-description");
const painDialogStep = $("#pain-dialog-step");
const painDialogClose = $("[data-pain-dialog-close]");

const PAIN_DETAILS = {
  resumes: {
    title: "Отклики уходят в тишину",
    description: "Когда резюме выглядит как перечень обязанностей, рекрутеру трудно быстро увидеть ваш уровень, вклад и соответствие роли. Опыт может быть сильным, но не считываться в первые секунды просмотра.",
    step: "Первый шаг: выбрать целевую роль и переписать 3-4 ключевых пункта через результат, масштаб задачи и контекст.",
  },
  interview: {
    title: "На интервью сложно собрать себя",
    description: "Сильный опыт иногда звучит как набор несвязанных эпизодов. Без общей линии собеседнику сложнее понять, как вы принимаете решения, что меняете в работе и куда хотите двигаться дальше.",
    step: "Первый шаг: выписать 3-4 рабочих ситуации и собрать каждую в короткую историю: задача, действие, результат, вывод.",
  },
  "market-value": {
    title: "Непонятно, сколько просить",
    description: "Без опоры на рынок, уровень роли и масштаб задач разговор о деньгах превращается в догадку. При этом одинаковые названия должностей часто означают совершенно разную ответственность.",
    step: "Первый шаг: сравнить несколько целевых вакансий по задачам, уровню влияния и диапазонам, а не только по названию позиции.",
  },
  "career-change": {
    title: "Хочется сменить сферу",
    description: "При смене отрасли привычный опыт легко кажется нерелевантным. На самом деле часть навыков, результатов и способов работы уже переносима - важно назвать ее языком новой среды.",
    step: "Первый шаг: отметить в своем опыте повторяющиеся задачи и результаты, которые будут полезны в новой сфере.",
  },
  growth: {
    title: "Есть рост, но нет направления",
    description: "Следующая должность может выглядеть логичной только по названию, но не приближать к нужному формату работы. Без критериев легко выбрать роль, которая не подходит по масштабу, задачам или среде.",
    step: "Первый шаг: сформулировать три критерия следующей роли: какие задачи, уровень ответственности и формат работы вам важны.",
  },
  "chaotic-search": {
    title: "Поиск идет хаотично",
    description: "Отклики, разговоры и ожидание обратной связи идут параллельно, но не складываются в понятную систему. Так трудно увидеть, что уже работает, где теряется время и что стоит изменить в подаче.",
    step: "Первый шаг: собрать простую недельную воронку поиска - целевые роли, отклики, контакты, интервью и следующие действия.",
  },
};

if (painItems.length && painDialog) {
  let lastPainTrigger = null;

  function selectPainItem(selectedItem) {
    painItems.forEach((item) => {
      const isSelected = item === selectedItem;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function openPainDialog(trigger) {
    const detail = PAIN_DETAILS[trigger.dataset.painId];
    if (!detail) return;

    lastPainTrigger = trigger;
    selectPainItem(trigger);
    painDialogTitle.textContent = detail.title;
    painDialogDescription.textContent = detail.description;
    painDialogStep.textContent = detail.step;
    document.body.classList.add("dialog-open");
    painDialog.showModal();
  }

  function closePainDialog() {
    if (painDialog.open) painDialog.close();
  }

  painItems.forEach((item) => {
    item.addEventListener("pointerenter", () => selectPainItem(item));
    item.addEventListener("focus", () => selectPainItem(item));
    item.addEventListener("click", () => openPainDialog(item));
  });

  painDialogClose?.addEventListener("click", closePainDialog);

  painDialog.addEventListener("click", (event) => {
    if (event.target === painDialog) closePainDialog();
  });

  painDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    window.requestAnimationFrame(() => lastPainTrigger?.focus());
  });
}

const MESSENGER_CONFIG = {
  MAX: {
    label: "Логин или ссылка в MAX",
    placeholder: "@username или max.ru/u/...",
    hint: "логин или ссылку в MAX",
  },
  Telegram: {
    label: "Ник в Telegram",
    placeholder: "@username",
    hint: "логин в Telegram",
  },
  WhatsApp: {
    label: "Номер в WhatsApp",
    placeholder: "+7 (999) 000-00-00",
    hint: "номер в WhatsApp",
  },
  ВКонтакте: {
    label: "Ссылка на профиль или ник ВКонтакте",
    placeholder: "vk.com/username",
    hint: "ссылку или ник ВКонтакте",
  },
  Instagram: {
    label: "Ник в Instagram",
    placeholder: "@username",
    hint: "ник в Instagram",
  },
};

function initMessengerSelector(container, radioName, labelId, inputId, errorId, phoneId) {
  const radios = $$(`input[name="${radioName}"]`, container);
  const label = $(`#${labelId}`, container);
  const input = $(`#${inputId}`, container);
  const error = $(`#${errorId}`, container);
  const phone = $(`#${phoneId}`, container);

  function update() {
    const checked = $(`input[name="${radioName}"]:checked`, container);
    const messenger = checked ? checked.value : "Telegram";
    const config = MESSENGER_CONFIG[messenger] || MESSENGER_CONFIG.Telegram;

    if (label) label.innerHTML = `${config.label} <span aria-hidden="true">*</span>`;
    if (input) {
      input.placeholder = config.placeholder;
      if (messenger === "WhatsApp" && phone && phone.value.trim() && !input.value.trim()) {
        input.value = phone.value.trim();
        input.dataset.autoSynced = "true";
      }
    }
    if (error) error.textContent = "";
  }

  radios.forEach((r) => r.addEventListener("change", update));

  if (phone && input) {
    phone.addEventListener("input", () => {
      const checked = $(`input[name="${radioName}"]:checked`, container);
      if (checked && checked.value === "WhatsApp" && (!input.value.trim() || input.dataset.autoSynced === "true")) {
        input.value = phone.value.trim();
        input.dataset.autoSynced = "true";
      }
    });
    input.addEventListener("input", () => {
      input.dataset.autoSynced = "false";
    });
  }

  update();
}

const quizForm = $("#career-quiz");

if (quizForm) {
  const steps = $$("[data-step]", quizForm);
  const nextButton = $("[data-quiz-next]", quizForm);
  const backButton = $("[data-quiz-back]", quizForm);
  const submitButton = $("[data-quiz-submit]", quizForm);
  const progressBar = $("[data-progress-bar]", quizForm);
  const progressLabel = $("[data-progress-label]", quizForm);
  const progressPercent = $("[data-progress-percent]", quizForm);
  const formModeNote = $("[data-form-mode-note]", quizForm);
  const formStatus = $("[data-form-status]", quizForm);

  const quizState = {
    currentStep: 1,
    selectedService: "",
    isSubmitting: false,
  };

  const serviceNames = {
    consultation: "Консультация",
    resume: "Резюме + стратегия",
    strategy: "Резюме + стратегия",
    "resume-strategy": "Резюме + стратегия",
    "resume-fix": "Резюме",
    support: "Сопровождение до оффера",
  };

  const recommendationCopy = {
    consultation: {
      title: "Консультация",
      text: "Сверим цель, рынок и следующий карьерный шаг.",
    },
    "resume-strategy": {
      title: "Резюме + стратегия",
      text: "Сильная упаковка опыта и понятный план выхода на рынок.",
    },
    "resume-fix": {
      title: "Резюме",
      text: "Усилим и упакуем ваш опыт за одну встречу.",
    },
    support: {
      title: "Сопровождение до оффера",
      text: "Комплексный трек от резюме до финального оффера.",
    },
  };

  const recommendationBonuses = {
    consultation: {
      title: "Аудио-разбор от HRD",
      desc: "Запишу голосовой разбор в мессенджер: разберу цель и подсвечу 2–3 точки роста.",
    },
    "resume-fix": {
      title: "Экспресс-аудит резюме от HRD",
      desc: "Подсвечу 2–3 главные ошибки и пришлю голосовой разбор в мессенджер.",
    },
    "resume-strategy": {
      title: "3 ориентира по цели",
      desc: "Пришлю голосовой разбор: ориентиры по рынку, вилке и позициям в мессенджер.",
    },
    support: {
      title: "План действий до оффера",
      desc: "Пришлю голосовой экспресс-маршрут: шаги от текущей точки до оффера в мессенджер.",
    },
  };

  function getRadioValue(name) {
    const checked = $(`input[name="${name}"]:checked`, quizForm);
    if (!checked) return "";
    if (checked.value !== "other") return checked.value;
    const customInput = $(`[name="${name}Other"]`, quizForm);
    return customInput?.value.trim() || "";
  }

  function getQuizAnswers() {
    return {
      goal: getRadioValue("goal"),
      level: getRadioValue("level"),
      industry: getRadioValue("industry"),
      blocker: getRadioValue("blocker"),
    };
  }

  function inferRecommendation() {
    if (quizState.selectedService) {
      if (quizState.selectedService === "support") return "support";
      if (quizState.selectedService === "resume-fix" || quizState.selectedService === "resume") return "resume-fix";
      if (["strategy", "resume-strategy"].includes(quizState.selectedService)) return "resume-strategy";
      if (quizState.selectedService === "consultation") return "consultation";
    }

    const { goal, blocker } = getQuizAnswers();
    const combined = `${goal} ${blocker}`.toLowerCase();

    if (combined.includes("собеседован") || combined.includes("оффер")) return "support";
    if (blocker.includes("Резюме не цепляет") || blocker.includes("приглашения")) return "resume-fix";
    if (
      combined.includes("сменить отрасль") ||
      combined.includes("сменить профессию") ||
      combined.includes("новую работу") ||
      combined.includes("рыночную стоимость")
    ) return "resume-strategy";
    return "consultation";
  }

  function updateRecommendation() {
    const key = inferRecommendation();
    const recommendation = recommendationCopy[key] || recommendationCopy.consultation;
    const title = $("[data-recommendation-title]", quizForm);
    const text = $("[data-recommendation-text]", quizForm);
    if (title) title.textContent = recommendation.title;
    if (text) text.textContent = recommendation.text;

    const bonus = recommendationBonuses[key] || recommendationBonuses.consultation;
    const bonusTitle = $("[data-bonus-title]", quizForm);
    const bonusDesc = $("[data-bonus-desc]", quizForm);
    if (bonusTitle) bonusTitle.textContent = bonus.title;
    if (bonusDesc) bonusDesc.textContent = bonus.desc;

    quizState.selectedService = quizState.selectedService || key;
  }

  function showStep(stepNumber, shouldFocus = true) {
    quizState.currentStep = stepNumber;
    steps.forEach((step) => {
      const isCurrent = Number(step.dataset.step) === stepNumber;
      step.hidden = !isCurrent;
      step.classList.toggle("is-active", isCurrent);
    });

    const percent = Math.round((stepNumber / steps.length) * 100);
    progressBar.style.width = `${percent}%`;
    progressLabel.textContent = `Шаг ${stepNumber} из ${steps.length}`;
    progressPercent.textContent = `${percent}%`;

    backButton.hidden = stepNumber === 1;
    nextButton.hidden = stepNumber === steps.length;
    submitButton.hidden = stepNumber !== steps.length;

    if (stepNumber === steps.length) updateRecommendation();

    if (shouldFocus) {
      const activeStep = steps.find((step) => Number(step.dataset.step) === stepNumber);
      activeStep.tabIndex = -1;
      activeStep.focus({ preventScroll: true });
    }
  }

  function setStepError(step, message) {
    const error = $("[data-step-error]", step);
    if (error) error.textContent = message;
  }

  function validateStep(stepNumber) {
    const step = steps.find((item) => Number(item.dataset.step) === stepNumber);
    if (!step) return false;
    const radio = $("input[type=" + '"radio"' + "]:checked", step);
    setStepError(step, "");

    if (!radio) {
      setStepError(step, "Выберите один вариант, чтобы продолжить.");
      $("input[type=" + '"radio"' + "]", step)?.focus();
      return false;
    }

    if (radio.value === "other") {
      const name = radio.name;
      const customInput = $(`[name="${name}Other"]`, step);
      if (!customInput?.value.trim()) {
        customInput?.setAttribute("aria-invalid", "true");
        setStepError(step, "Напишите свой вариант.");
        customInput?.focus();
        return false;
      }
      customInput.removeAttribute("aria-invalid");
    }
    return true;
  }

  function handleOtherField(radio) {
    const name = radio.name;
    const container = $(`[data-other-field="${name}"]`, quizForm);
    if (!container) return;
    const shouldShow = radio.value === "other" && radio.checked;
    container.hidden = !shouldShow;
    const input = $("input", container);
    if (input) {
      input.required = shouldShow;
      if (!shouldShow) input.removeAttribute("aria-invalid");
    }
  }

  $$('input[type="radio"]', quizForm).forEach((radio) => {
    radio.addEventListener("change", () => {
      $$(`input[name="${radio.name}"]`, quizForm).forEach(handleOtherField);
      const step = radio.closest("[data-step]");
      if (step) setStepError(step, "");
    });
  });

  nextButton.addEventListener("click", () => {
    if (validateStep(quizState.currentStep)) showStep(quizState.currentStep + 1);
  });

  backButton.addEventListener("click", () => {
    if (quizState.currentStep > 1) showStep(quizState.currentStep - 1);
  });

  $$('[data-service-select]').forEach((link) => {
    link.addEventListener("click", () => {
      quizState.selectedService = link.dataset.serviceSelect || "";
      const chosenName = serviceNames[quizState.selectedService];
      if (chosenName) {
        formStatus.textContent = `Предварительно выбран формат: ${chosenName}. Ответы квиза помогут проверить выбор.`;
      }
    });
  });

  function setFieldError(input, errorId, message) {
    const error = $(`#${errorId}`, quizForm);
    if (error) error.textContent = message;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errorId);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
  }

  initMessengerSelector(quizForm, "quizMessenger", "quiz-messenger-label", "quiz-messenger-handle", "quiz-messenger-error", "quiz-phone");

  function validateContactStep() {
    const nameInput = $("#name", quizForm);
    const phoneInput = $("#quiz-phone", quizForm);
    const handleInput = $("#quiz-messenger-handle", quizForm);
    const consentInput = $('input[name="consent"]', quizForm);
    let firstInvalid = null;

    setFieldError(nameInput, "name-error", "");
    setFieldError(phoneInput, "quiz-phone-error", "");
    setFieldError(handleInput, "quiz-messenger-error", "");
    $("#consent-error", quizForm).textContent = "";

    if (nameInput.value.trim().length < 2) {
      setFieldError(nameInput, "name-error", "Напишите имя — минимум два символа.");
      firstInvalid = nameInput;
    }

    const phoneVal = phoneInput?.value.trim() || "";
    if (!phoneVal || phoneVal.replace(/\D/g, "").length < 7) {
      setFieldError(phoneInput, "quiz-phone-error", "Укажите корректный номер телефона.");
      firstInvalid ||= phoneInput;
    }

    const checkedMessenger = $('input[name="quizMessenger"]:checked', quizForm)?.value || "Telegram";
    const handleVal = handleInput?.value.trim() || "";
    if (!handleVal || handleVal.length < 2) {
      setFieldError(handleInput, "quiz-messenger-error", `Укажите, как найти вас в ${checkedMessenger} (логин, номер или ссылку).`);
      firstInvalid ||= handleInput;
    }

    if (!consentInput.checked) {
      $("#consent-error", quizForm).textContent = "Необходимо согласие на обработку персональных данных.";
      firstInvalid ||= consentInput;
    }

    firstInvalid?.focus();
    return !firstInvalid;
  }

  function buildPayload() {
    const data = new FormData(quizForm);
    const phone = String(data.get("phone") || "").trim();
    const preferredMessenger = String(data.get("quizMessenger") || "Telegram").trim();
    const messengerHandle = String(data.get("messengerHandle") || "").trim();
    const compositeContact = `Тел: ${phone} | ${preferredMessenger}: ${messengerHandle}`;

    return {
      name: String(data.get("name") || "").trim(),
      phone,
      preferredMessenger,
      messengerHandle,
      contact: compositeContact,
      comment: String(data.get("comment") || "").trim(),
      consent: data.get("consent") === "on",
      website: String(data.get("website") || "").trim(),
      selectedService: recommendationCopy[inferRecommendation()]?.title || "Консультация",
      quiz: getQuizAnswers(),
      pageUrl: window.location.href,
    };
  }

  function setSubmitting(isSubmitting) {
    quizState.isSubmitting = isSubmitting;
    submitButton.disabled = isSubmitting;
    $("span", submitButton).textContent = isSubmitting ? "Отправляем…" : "Получить разбор и бонус 🎁";
  }

  submitButton.disabled = false;
  if (formModeNote) {
    formModeNote.hidden = true;
  }

  quizForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "";

    if (quizState.isSubmitting || !validateContactStep()) return;

    const payload = buildPayload();
    const bonusTitleText = $("[data-bonus-title]", quizForm)?.textContent?.trim() || "Персональный бонус";
    const confirmMsg = `Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время для уточнения деталей, а бонус за прохождение диагностики отправим в указанный вами мессенджер (${payload.preferredMessenger}).`;
    formStatus.textContent = confirmMsg;

    const dlg = $("#order-dialog");
    if (dlg) {
      const successCard = $("#order-success-card", dlg);
      const successSubtitle = $("#order-success-subtitle", dlg);
      const successTariff = $("#success-tariff-name", dlg);
      const successContact = $("#success-contact-value", dlg);
      const successBonusRow = $("#success-bonus-row", dlg);
      const successBonusValue = $("#success-bonus-value", dlg);
      const headerNode = $(".order-dialog-header", dlg);
      const dForm = $("#direct-order-form", dlg);

      if (successSubtitle) {
        successSubtitle.textContent = "Спасибо за ответы! Мы свяжемся с вами в ближайшее время для уточнения деталей и подбора удобного времени, а ваш бонус за прохождение диагностики отправим в указанный вами мессенджер.";
      }
      if (successTariff) successTariff.textContent = payload.selectedService;
      if (successContact) successContact.textContent = `${payload.phone} (${payload.preferredMessenger}: ${payload.messengerHandle})`;
      if (successBonusRow && successBonusValue) {
        successBonusValue.textContent = `${bonusTitleText} → отправим в ${payload.preferredMessenger}`;
        successBonusRow.hidden = false;
      }
      if (dForm) dForm.hidden = true;
      if (headerNode) headerNode.hidden = true;
      if (successCard) successCard.hidden = false;

      document.body.classList.add("dialog-open");
      dlg.showModal();
    }

    if (!SITE_CONFIG.formEnabled) {
      return;
    }
    if (sessionStorage.getItem("kristinaLeadSubmitted") === "true") {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(SITE_CONFIG.workerEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({ ok: false, error: "Некорректный ответ сервера" }));
      if (!response.ok || !result.ok) throw new Error(result.error || "Не удалось отправить заявку");

      sessionStorage.setItem("kristinaLeadSubmitted", "true");
      submitButton.disabled = true;
    } catch (error) {
      console.warn("Lead dispatch warning:", error);
    } finally {
      if (sessionStorage.getItem("kristinaLeadSubmitted") !== "true") setSubmitting(false);
    }
  });

  showStep(1, false);
}

// Direct Order Modal Handler
const orderDialog = $("#order-dialog");
const orderDialogCloseButtons = $$("[data-order-dialog-close]");
const orderForm = $("#direct-order-form");
const orderTariffButtons = $$("[data-order-tariff]");

if (orderDialog && orderForm) {
  let lastOrderTrigger = null;

  function openOrderDialog(trigger) {
    lastOrderTrigger = trigger;
    const tariffCode = trigger.dataset.orderTariff || "";
    const name = trigger.dataset.tariffName || "Консультация";
    const rawPrice = trigger.dataset.tariffPrice || "";

    const nameNode = $("#order-tariff-name", orderDialog);
    const priceNode = $("#order-tariff-price", orderDialog);
    const tagNode = $(".order-tariff-tag", orderDialog);
    const inputNode = $("#order-service-input", orderDialog);

    if (nameNode) nameNode.textContent = name;
    if (inputNode) inputNode.value = name;

    if (tariffCode === "support" || rawPrice.includes("30 000") || rawPrice.includes("от") || rawPrice.includes("консультации")) {
      const customPriceText = "Финальная стоимость определяется после консультации";
      if (priceNode) priceNode.textContent = customPriceText;
      if (tagNode) {
        tagNode.classList.add("is-custom-price");
        tagNode.innerHTML = `<strong id="order-tariff-name">${name}</strong> • <span id="order-tariff-price">${customPriceText}</span>`;
      }
    } else {
      if (priceNode) priceNode.textContent = rawPrice;
      if (tagNode) {
        tagNode.classList.remove("is-custom-price");
        tagNode.innerHTML = `<strong id="order-tariff-name">${name}</strong> • <span id="order-tariff-price">${rawPrice}</span>`;
      }
    }

    const orderStatus = $("#order-form-status", orderDialog);
    if (orderStatus) orderStatus.textContent = "";

    const orderModeNote = $("[data-order-mode-note]", orderDialog);
    const submitBtn = $("#order-submit-btn", orderDialog);

    if (submitBtn) submitBtn.disabled = false;
    if (orderModeNote) orderModeNote.textContent = "Заявка будет отправлена напрямую Кристине.";

    document.body.classList.add("dialog-open");
    orderDialog.showModal();
  }

  function closeOrderDialog() {
    document.body.classList.remove("dialog-open");
    if (orderDialog.open) {
      orderDialog.close();
    } else {
      orderDialog.removeAttribute("open");
    }
  }

  orderTariffButtons.forEach((button) => {
    button.addEventListener("click", () => openOrderDialog(button));
  });

  orderDialogCloseButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      closeOrderDialog();
    });
  });

  orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog || event.target.closest("[data-order-dialog-close], .order-dialog-close")) {
      closeOrderDialog();
    }
  });

  initMessengerSelector(orderDialog, "orderMessenger", "order-messenger-label", "order-messenger-handle", "order-messenger-error", "order-phone");

  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const statusNode = $("#order-form-status", orderDialog);
    const submitBtn = $("#order-submit-btn", orderDialog);
    const nameInput = $("#order-name", orderDialog);
    const phoneInput = $("#order-phone", orderDialog);
    const handleInput = $("#order-messenger-handle", orderDialog);
    const commentInput = $("#order-comment", orderDialog);
    const consentInput = $("#order-consent", orderDialog);

    const nameError = $("#order-name-error", orderDialog);
    const phoneError = $("#order-phone-error", orderDialog);
    const handleError = $("#order-messenger-error", orderDialog);
    const consentError = $("#order-consent-error", orderDialog);

    if (nameError) nameError.textContent = "";
    if (phoneError) phoneError.textContent = "";
    if (handleError) handleError.textContent = "";
    if (consentError) consentError.textContent = "";
    if (statusNode) statusNode.textContent = "";

    const nameVal = nameInput?.value.trim() || "";
    const phoneVal = phoneInput?.value.trim() || "";
    const checkedMessenger = $('input[name="orderMessenger"]:checked', orderDialog)?.value || "Telegram";
    const handleVal = handleInput?.value.trim() || "";

    let valid = true;
    if (!nameVal || nameVal.length < 2) {
      if (nameError) nameError.textContent = "Укажите имя (минимум 2 символа).";
      nameInput?.focus();
      valid = false;
    }
    if (!phoneVal || phoneVal.replace(/\D/g, "").length < 7) {
      if (phoneError) phoneError.textContent = "Укажите корректный номер телефона.";
      if (valid) phoneInput?.focus();
      valid = false;
    }
    if (!handleVal || handleVal.length < 2) {
      if (handleError) handleError.textContent = `Укажите, как найти вас в ${checkedMessenger} (логин, номер или ссылку).`;
      if (valid) handleInput?.focus();
      valid = false;
    }
    if (!consentInput?.checked) {
      if (consentError) consentError.textContent = "Необходимо согласие на обработку персональных данных.";
      if (valid) consentInput?.focus();
      valid = false;
    }

    if (!valid) return;

    if (submitBtn) submitBtn.disabled = true;
    if (statusNode) statusNode.textContent = "Отправляем заявку…";

    const compositeContact = `Тел: ${phoneVal} | ${checkedMessenger}: ${handleVal}`;

    const payload = {
      name: nameVal,
      phone: phoneVal,
      preferredMessenger: checkedMessenger,
      messengerHandle: handleVal,
      contact: compositeContact,
      comment: commentInput ? commentInput.value.trim() : "",
      consent: true,
      website: $("#order-website", orderDialog)?.value.trim() || "",
      selectedService: $("#order-service-input", orderDialog)?.value || "Консультация",
      quiz: { directOrder: "Прямой заказ тарифа без квиза" },
      pageUrl: window.location.href,
    };

    // Show Success Card Screen
    const successCard = $("#order-success-card", orderDialog);
    const successSubtitle = $("#order-success-subtitle", orderDialog);
    const successTariff = $("#success-tariff-name", orderDialog);
    const successContact = $("#success-contact-value", orderDialog);
    const successBonusRow = $("#success-bonus-row", orderDialog);
    const headerNode = $(".order-dialog-header", orderDialog);

    if (successSubtitle) {
      successSubtitle.textContent = "Спасибо за обращение! Мы свяжемся с вами в ближайшее время для уточнения деталей и согласования удобного времени встречи.";
    }
    if (successTariff) successTariff.textContent = payload.selectedService;
    if (successContact) successContact.textContent = `${phoneVal} (${checkedMessenger}: ${handleVal})`;
    if (successBonusRow) successBonusRow.hidden = true;

    if (orderForm) orderForm.hidden = true;
    if (headerNode) headerNode.hidden = true;
    if (successCard) successCard.hidden = false;

    // Send payload in background if endpoint exists
    if (SITE_CONFIG.formEnabled) {
      try {
        await fetch(SITE_CONFIG.workerEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Lead dispatch warning:", err);
      }
    }
  });

  // Reset dialog state when closed
  orderDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
    window.requestAnimationFrame(() => lastOrderTrigger?.focus());

    // Reset form and views for next use
    const successCard = $("#order-success-card", orderDialog);
    const successBonusRow = $("#success-bonus-row", orderDialog);
    const headerNode = $(".order-dialog-header", orderDialog);
    const submitBtn = $("#order-submit-btn", orderDialog);

    if (orderForm) {
      orderForm.reset();
      orderForm.hidden = false;
    }
    if (headerNode) headerNode.hidden = false;
    if (successCard) successCard.hidden = true;
    if (successBonusRow) successBonusRow.hidden = true;
    if (submitBtn) submitBtn.disabled = false;
  });
}

// Stop propagation on consent links inside labels so clicking them opens the policy/consent without toggling the checkbox
$$(".consent a, .compact-consent a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});



/* Floating Telegram Widget Scroll Visibility */
const floatingTgWidget = document.getElementById("floating-tg-widget");
if (floatingTgWidget) {
  const toggleFloatingWidget = () => {
    if (window.scrollY > 320) {
      floatingTgWidget.classList.add("is-visible");
    } else {
      floatingTgWidget.classList.remove("is-visible");
    }
  };
  window.addEventListener("scroll", toggleFloatingWidget, { passive: true });
  toggleFloatingWidget();
}

/* File Attachment Handling UI */
function setupFileUpload(inputId, nameWrapId, textId, removeBtnId, errorId) {
  const fileInput = document.getElementById(inputId);
  const nameWrap = document.getElementById(nameWrapId);
  const fileText = document.getElementById(textId);
  const removeBtn = document.getElementById(removeBtnId);
  const errorNode = document.getElementById(errorId);

  if (!fileInput) return;

  fileInput.addEventListener("change", () => {
    if (errorNode) errorNode.textContent = "";
    const file = fileInput.files[0];
    if (!file) {
      if (nameWrap) nameWrap.hidden = true;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (errorNode) errorNode.textContent = "Файл слишком большой. Максимальный размер: 10 МБ.";
      fileInput.value = "";
      if (nameWrap) nameWrap.hidden = true;
      return;
    }

    if (fileText) fileText.textContent = file.name;
    if (nameWrap) nameWrap.hidden = false;
  });

  if (removeBtn) {
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.value = "";
      if (nameWrap) nameWrap.hidden = true;
      if (errorNode) errorNode.textContent = "";
    });
  }
}

setupFileUpload("order-resume-file", "order-file-name", "order-file-text", "order-file-remove", "order-file-error");
setupFileUpload("quiz-resume-file", "quiz-file-name", "quiz-file-text", "quiz-file-remove", "quiz-file-error");

/* Sticky Mobile Bar Scroll Logic */
const stickyMobileBar = document.getElementById("sticky-mobile-bar");
const diagnosticSection = document.getElementById("diagnostic");

if (stickyMobileBar) {
  const toggleStickyBar = () => {
    const scrollY = window.scrollY;
    let inDiagnostic = false;

    if (diagnosticSection) {
      const rect = diagnosticSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        inDiagnostic = true;
      }
    }

    if (scrollY > 350 && !inDiagnostic) {
      stickyMobileBar.classList.add("is-visible");
    } else {
      stickyMobileBar.classList.remove("is-visible");
    }
  };

  window.addEventListener("scroll", toggleStickyBar, { passive: true });
  toggleStickyBar();
}



/* Reviews Tab Switcher & Lightbox */
const reviewsTabButtons = document.querySelectorAll("[data-reviews-tab]");
const reviewsTextGrid = document.getElementById("reviews-text-grid");
const reviewsScreenshotsGrid = document.getElementById("reviews-screenshots-grid");

const lightboxDialog = document.getElementById("review-lightbox-dialog");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");

function bindPhotoCardsLightbox() {
  const photoCards = document.querySelectorAll("[data-review-lightbox]");
  photoCards.forEach((card) => {
    // Avoid double attaching
    if (card._hasLightbox) return;
    card._hasLightbox = true;

    card.addEventListener("click", () => {
      const imgSrc = card.dataset.reviewLightbox;
      if (imgSrc && lightboxDialog && lightboxImg) {
        lightboxImg.src = imgSrc;
        document.body.classList.add("dialog-open");
        lightboxDialog.showModal();
      }
    });
  });
}

if (lightboxDialog) {
  const closeLightbox = () => {
    if (lightboxDialog.open) lightboxDialog.close();
  };
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxDialog.addEventListener("click", (e) => {
    if (e.target === lightboxDialog) closeLightbox();
  });
  lightboxDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });
}

bindPhotoCardsLightbox();

// Clear any previously uploaded screenshots stored in browser cache
try {
  localStorage.removeItem("kristina_user_reviews_screenshots");
} catch (e) {
  // Ignore in restricted iframe or sandbox
}

if (reviewsTabButtons.length > 0) {
  reviewsTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.reviewsTab;

      reviewsTabButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");

      if (tab === "text") {
        if (reviewsTextGrid) reviewsTextGrid.hidden = false;
        if (reviewsScreenshotsGrid) reviewsScreenshotsGrid.hidden = true;
      } else {
        if (reviewsTextGrid) reviewsTextGrid.hidden = true;
        if (reviewsScreenshotsGrid) reviewsScreenshotsGrid.hidden = false;
      }
    });
  });
}

/* Contact Copy to Clipboard Feature */
const copyElements = document.querySelectorAll("[data-copy-text]");
const toastNode = document.getElementById("copy-toast-notification");
const toastTextNode = document.getElementById("copy-toast-text");
let toastTimeout = null;

function showCopyToast(message) {
  if (!toastNode) return;
  if (toastTextNode) toastTextNode.textContent = message;
  toastNode.hidden = false;
  toastNode.classList.add("is-show");

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastNode.classList.remove("is-show");
    setTimeout(() => {
      toastNode.hidden = true;
    }, 300);
  }, 2500);
}

copyElements.forEach((el) => {
  el.addEventListener("click", async (e) => {
    const textToCopy = el.dataset.copyText;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showCopyToast(`Скопировано: ${textToCopy}`);
    } catch (err) {
      console.warn("Clipboard copy fallback:", err);
    }
  });
});

/* Booking Calendar Widget JS Logic */
const bookingDays = document.querySelectorAll(".booking-day-btn");
const bookingSlots = document.querySelectorAll(".booking-slot-btn");
const dateInput = document.getElementById("order-booking-date");
const timeInput = document.getElementById("order-booking-time");
const summaryNode = document.getElementById("order-booking-summary");

function updateBookingSummary() {
  const currentDate = dateInput ? dateInput.value : "";
  const currentTime = timeInput ? timeInput.value : "";
  if (summaryNode) {
    summaryNode.innerHTML = `✓ Ориентир встречи: <strong>${currentDate} в ${currentTime}</strong>`;
  }
}

bookingDays.forEach((btn) => {
  btn.addEventListener("click", () => {
    bookingDays.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (dateInput) dateInput.value = btn.dataset.bookingDate;
    updateBookingSummary();
  });
});

bookingSlots.forEach((btn) => {
  btn.addEventListener("click", () => {
    bookingSlots.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    if (timeInput) timeInput.value = btn.dataset.bookingSlot;
    updateBookingSummary();
  });
});

/* Audio Greeting Player Logic */
const audioPlayerContainer = document.getElementById("audio-greeting-player");
const audioPlayBtn = document.getElementById("audio-play-btn");
const audioElement = document.getElementById("audio-element");
const audioTimeNode = document.getElementById("audio-time");
const playIcon = audioPlayBtn?.querySelector(".play-icon");
const pauseIcon = audioPlayBtn?.querySelector(".pause-icon");

if (audioPlayBtn && audioElement) {
  let isPlaying = false;

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  audioElement.addEventListener("loadedmetadata", () => {
    if (audioTimeNode && !isNaN(audioElement.duration)) {
      audioTimeNode.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
    }
  });

  audioElement.addEventListener("timeupdate", () => {
    if (audioTimeNode && !isNaN(audioElement.duration)) {
      audioTimeNode.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration || 17)}`;
    }
  });

  audioElement.addEventListener("ended", () => {
    isPlaying = false;
    audioPlayerContainer?.classList.remove("is-playing");
    if (playIcon) playIcon.hidden = false;
    if (pauseIcon) pauseIcon.hidden = true;
  });

  function toggleAudio() {
    if (!isPlaying) {
      audioElement.play().then(() => {
        isPlaying = true;
        audioPlayerContainer?.classList.add("is-playing");
        if (playIcon) playIcon.hidden = true;
        if (pauseIcon) pauseIcon.hidden = false;
      }).catch((err) => {
        console.info("Audio play fallback demo mode:", err);
        isPlaying = true;
        audioPlayerContainer?.classList.add("is-playing");
        if (playIcon) playIcon.hidden = true;
        if (pauseIcon) pauseIcon.hidden = false;
      });
    } else {
      audioElement.pause();
      isPlaying = false;
      audioPlayerContainer?.classList.remove("is-playing");
      if (playIcon) playIcon.hidden = false;
      if (pauseIcon) pauseIcon.hidden = true;
    }
  }

  audioPlayerContainer.addEventListener("click", () => {
    toggleAudio();
  });
}

/* Interactive FAQ Shutter Cards (Плавное открытие и единая высота) */
const shutterCards = document.querySelectorAll("[data-shutter-card]");

function closeFaqCard(card) {
  card.classList.remove("is-open");
  card.style.height = "";
}

function openFaqCard(card) {
  card.classList.add("is-open");
  const answerLayer = card.querySelector(".faq-answer-layer");
  if (answerLayer) {
    const targetHeight = answerLayer.scrollHeight + 4;
    card.style.height = `${targetHeight}px`;
  }
}

shutterCards.forEach((card) => {
  card.addEventListener("click", (e) => {
    if (e.target.closest(".faq-shutter-back")) {
      e.stopPropagation();
      closeFaqCard(card);
      return;
    }
    if (card.classList.contains("is-open")) {
      closeFaqCard(card);
    } else {
      openFaqCard(card);
    }
  });
});

/* Full-Screen Video Modal Handler */
const videoPlayerCard = document.getElementById("video-player-card");
const videoPlayBtn = document.getElementById("video-play-btn");
const videoFullscreenDialog = document.getElementById("video-fullscreen-dialog");
const videoModalCloseBtn = document.getElementById("video-modal-close");
const fullscreenVideoElement = document.getElementById("fullscreen-video-element");
const videoModalChooseTariff = document.getElementById("video-modal-choose-tariff");

function openFullscreenVideo() {
  if (!videoFullscreenDialog) return;
  document.body.classList.add("dialog-open");
  videoFullscreenDialog.showModal();

  if (fullscreenVideoElement) {
    fullscreenVideoElement.hidden = false;
    fullscreenVideoElement.currentTime = 0;
    fullscreenVideoElement.play().catch((e) => console.info("Autoplay notice:", e));
  }
}

function closeFullscreenVideo() {
  if (!videoFullscreenDialog || !videoFullscreenDialog.open) return;
  if (fullscreenVideoElement) {
    if (!fullscreenVideoElement.paused) {
      fullscreenVideoElement.pause();
    }
    fullscreenVideoElement.currentTime = 0;
  }
  videoFullscreenDialog.close();
}

videoPlayBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  openFullscreenVideo();
});

videoPlayerCard?.addEventListener("click", () => {
  openFullscreenVideo();
});

videoModalCloseBtn?.addEventListener("click", closeFullscreenVideo);

videoFullscreenDialog?.addEventListener("click", (e) => {
  if (e.target === videoFullscreenDialog) {
    closeFullscreenVideo();
  }
});

videoFullscreenDialog?.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
  if (fullscreenVideoElement) {
    if (!fullscreenVideoElement.paused) {
      fullscreenVideoElement.pause();
    }
    fullscreenVideoElement.currentTime = 0;
  }
});

videoModalChooseTariff?.addEventListener("click", () => {
  closeFullscreenVideo();
});

/* Quick Contact Choice Dialog Handler */
const floatingContactBtn = document.getElementById("floating-contact-btn");
const contactChoiceDialog = document.getElementById("contact-choice-dialog");
const contactChoiceClose = document.getElementById("contact-choice-close");

if (floatingContactBtn && contactChoiceDialog) {
  floatingContactBtn.addEventListener("click", () => {
    document.body.classList.add("dialog-open");
    contactChoiceDialog.showModal();
  });

  contactChoiceClose?.addEventListener("click", () => {
    contactChoiceDialog.close();
  });

  contactChoiceDialog.addEventListener("click", (e) => {
    if (e.target === contactChoiceDialog) {
      contactChoiceDialog.close();
    }
  });

  contactChoiceDialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });
}

/* Master Results Tab Switcher (До/После vs Кейсы) */
const resultsTabButtons = document.querySelectorAll("[data-results-tab]");
const resultsPanels = document.querySelectorAll(".results-tab-panel");

resultsTabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetTab = btn.dataset.resultsTab;
    resultsTabButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    resultsPanels.forEach((panel) => {
      if (panel.id === `panel-${targetTab}`) {
        panel.classList.add("is-active");
        panel.hidden = false;
      } else {
        panel.classList.remove("is-active");
        panel.hidden = true;
      }
    });
  });
});

/* ==========================================================================
   Cookie Consent Banner Initialization
   ========================================================================== */
function initCookieBanner() {
  const banner = document.getElementById("cookie-banner");
  const acceptBtn = document.getElementById("cookie-accept-btn");
  if (!banner || !acceptBtn) return;

  const STORAGE_KEY = "kristinahr_cookie_consent_v2";

  // Clean up legacy key so user immediately sees banner again on reload
  try {
    localStorage.removeItem("kristinahr_cookie_consent_accepted");
    // Also allow easy reset via URL hash/search (#reset-cookie or ?reset-cookie)
    if (window.location.hash.includes("cookie") || window.location.search.includes("cookie")) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {}

  try {
    if (localStorage.getItem(STORAGE_KEY) === "true") {
      banner.hidden = true;
      return;
    }
  } catch (e) {
    // localStorage may fail in restricted privacy modes, ignore safely
  }

  // Show banner with a smooth polite delay after page loads
  setTimeout(() => {
    banner.hidden = false;
    requestAnimationFrame(() => {
      banner.classList.add("is-visible");
    });
  }, 700);

  acceptBtn.addEventListener("click", () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (e) {}

    banner.classList.remove("is-visible");
    banner.classList.add("is-closing");
    setTimeout(() => {
      banner.hidden = true;
    }, 360);
  });
}

initCookieBanner();


