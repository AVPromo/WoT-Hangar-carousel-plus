const HCP_TOOLTIP_MODEL = "hangarCarouselPlusTooltip";

const HCP_TOOLTIP_LABELS = {
  en: {
    tooltip_statistics: "Vehicle statistics",
    tooltip_battles: "Battles",
    tooltip_win_rate: "Win rate",
    tooltip_average_damage: "Average damage",
    tooltip_mastery: "Mastery badge",
    tooltip_marks: "Marks of Excellence"
  },
  ru: {
    tooltip_statistics: "Статистика машины",
    tooltip_battles: "Бои",
    tooltip_win_rate: "Процент побед",
    tooltip_average_damage: "Средний урон",
    tooltip_mastery: "Знак классности",
    tooltip_marks: "Отметки на орудии"
  },
  uk: {
    tooltip_statistics: "Статистика машини",
    tooltip_battles: "Бої",
    tooltip_win_rate: "Відсоток перемог",
    tooltip_average_damage: "Середня шкода",
    tooltip_mastery: "Знак класності",
    tooltip_marks: "Відмітки на гарматі"
  }
};

const HCP_TOOLTIP_LANGUAGE_ALIASES = {
  en_gb: "en",
  en_us: "en",
  en_zw: "en",
  es_ar: "es",
  es_mx: "es",
  pt_br: "pt",
  sr_latn: "sr"
};

let hcpTooltipState = { stats: {}, statsConfig: {} };
let hcpTooltipStateJson = "";
let hcpTooltipScheduled = false;

function hcpTooltipUnwrap(value) {
  if (value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value")) {
    return value.value;
  }
  return value;
}

function hcpTooltipLanguage() {
  const raw = String(hcpTooltipState.language || document.documentElement.lang || navigator.language || "en")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const normalized = HCP_TOOLTIP_LANGUAGE_ALIASES[raw] || raw;
  const base = normalized.split("_")[0];
  const translations = window.HCP_I18N || {};
  if (HCP_TOOLTIP_LABELS[normalized] || translations[normalized]) return normalized;
  if (HCP_TOOLTIP_LABELS[base] || translations[base]) return base;
  return "en";
}

function hcpTooltipLabels() {
  const locale = hcpTooltipLanguage();
  return Object.assign(
    {},
    HCP_TOOLTIP_LABELS.en,
    (window.HCP_I18N || {})[locale] || {},
    HCP_TOOLTIP_LABELS[locale] || {}
  );
}

function hcpTooltipFindModel() {
  const rootCandidate = window.model?.[HCP_TOOLTIP_MODEL];
  if (rootCandidate) return rootCandidate;
  if (!window.subViews) return null;
  for (const id of window.subViews.ids()) {
    const root = window.subViews.get(id)?.model;
    const candidate = root?.[HCP_TOOLTIP_MODEL];
    if (candidate) return candidate;
  }
  return null;
}

function hcpTooltipFormat(value) {
  return Number(value || 0).toLocaleString();
}

function hcpTooltipWinRateBand(value) {
  const winRate = Number(value || 0);
  if (winRate < 47) return "bad";
  if (winRate < 50) return "below-average";
  if (winRate < 52) return "average";
  if (winRate < 55) return "good";
  if (winRate < 60) return "great";
  return "exceptional";
}

function hcpTooltipItems() {
  const stats = hcpTooltipState.stats || {};
  const fields = hcpTooltipState.statsConfig?.fields || [];
  const labels = hcpTooltipLabels();
  const items = [];
  if (fields.includes("battles")) {
    items.push({ label: labels.tooltip_battles, value: hcpTooltipFormat(stats.battles), classes: ["battles"] });
  }
  if (fields.includes("winRate")) {
    const winRate = Number(stats.winRate || 0);
    items.push({
      label: labels.tooltip_win_rate,
      value: `${winRate.toFixed(1)}%`,
      classes: ["win-rate", `win-rate-${hcpTooltipWinRateBand(winRate)}`]
    });
  }
  if (fields.includes("averageDamage")) {
    items.push({
      label: labels.tooltip_average_damage,
      value: hcpTooltipFormat(stats.averageDamage),
      classes: ["damage"]
    });
  }
  if (fields.includes("mastery") && Number(stats.mastery) > 0) {
    items.push({
      label: labels.tooltip_mastery,
      value: `M${Number(stats.mastery)}`,
      classes: ["mastery", `mastery-${Number(stats.mastery)}`]
    });
  }
  if (fields.includes("marksOnGun") && Number(stats.marksOnGun) > 0) {
    items.push({
      label: labels.tooltip_marks,
      value: String(Number(stats.marksOnGun)),
      classes: ["marks", `marks-${Number(stats.marksOnGun)}`]
    });
  }
  return items;
}

function hcpTooltipNativeSectionClass(root) {
  for (const child of root.children) {
    for (const className of child.classList) {
      if (className.startsWith("Tooltip_section_") && !className.startsWith("Tooltip_section__")) {
        return className;
      }
    }
  }
  return "";
}

function hcpTooltipRender() {
  const status = document.querySelector('[class*="Tooltip_status_"]');
  const root = status?.parentElement;
  if (!root) return;

  const minimumBattles = Number(hcpTooltipState.statsConfig?.minimumBattles ?? 1);
  const stats = hcpTooltipState.stats || {};
  let section = root.querySelector(".hcp-tooltip-stats");
  if (hcpTooltipState.statsConfig?.enabled === false || Number(stats.battles || 0) < minimumBattles) {
    if (section) section.remove();
    return;
  }

  const items = hcpTooltipItems();
  if (!items.length) {
    if (section) section.remove();
    return;
  }

  if (!section) {
    section = document.createElement("div");
    const nativeSectionClass = hcpTooltipNativeSectionClass(root);
    section.className = `hcp-tooltip-stats${nativeSectionClass ? ` ${nativeSectionClass}` : ""}`;
    root.insertBefore(section, status);
  }

  const signature = JSON.stringify([items, hcpTooltipLanguage()]);
  if (section.dataset.signature === signature) return;
  section.dataset.signature = signature;
  section.innerHTML = "";

  const title = document.createElement("div");
  title.className = "hcp-tooltip-stats-title";
  title.textContent = hcpTooltipLabels().tooltip_statistics;
  section.appendChild(title);

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "hcp-tooltip-stat-row";
    const value = document.createElement("div");
    value.className = `hcp-tooltip-stat-value ${item.classes.map((name) => `hcp-tooltip-stat-value--${name}`).join(" ")}`;
    value.textContent = item.value;
    const label = document.createElement("div");
    label.className = "hcp-tooltip-stat-label";
    label.textContent = item.label;
    row.appendChild(value);
    row.appendChild(label);
    section.appendChild(row);
  }
}

function hcpTooltipScheduleRender() {
  if (hcpTooltipScheduled) return;
  hcpTooltipScheduled = true;
  requestAnimationFrame(() => {
    hcpTooltipScheduled = false;
    hcpTooltipRender();
  });
}

function hcpTooltipSyncModel() {
  const model = hcpTooltipFindModel();
  if (!model) return;
  const stateJson = String(hcpTooltipUnwrap(model.stateJson) || "{}");
  if (stateJson === hcpTooltipStateJson) return;
  hcpTooltipStateJson = stateJson;
  try {
    hcpTooltipState = JSON.parse(stateJson);
  } catch (error) {
    console.error("[HangarCarouselPlus] Invalid tooltip state JSON", error);
    hcpTooltipState = { stats: {}, statsConfig: {} };
  }
  hcpTooltipScheduleRender();
}

engine.whenReady.then(() => {
  const observer = new MutationObserver(hcpTooltipScheduleRender);
  observer.observe(document.body, { childList: true, subtree: true });
  window.engine.on("subViews.onAdded", hcpTooltipSyncModel);
  window.setInterval(hcpTooltipSyncModel, 1000);
  hcpTooltipSyncModel();
  hcpTooltipScheduleRender();
});
