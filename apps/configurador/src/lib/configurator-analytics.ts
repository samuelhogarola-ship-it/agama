import type {
  ConfiguratorAnalyticsDetail,
  ConfiguratorAnalyticsEventName,
  ConfiguratorAnalyticsEventPayloadMap,
} from "@/lib/configurator-types";

export const CONFIGURATOR_ANALYTICS_EVENT = "agama:configurator-analytics";

export function emitConfiguratorAnalyticsEvent<TName extends ConfiguratorAnalyticsEventName>(
  name: TName,
  payload: ConfiguratorAnalyticsEventPayloadMap[TName],
) {
  if (typeof window === "undefined") {
    return;
  }

  const detail: ConfiguratorAnalyticsDetail<TName> = {
    name,
    payload,
    emittedAt: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent(CONFIGURATOR_ANALYTICS_EVENT, { detail }));
  const analyticsWindow = window as typeof window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: "event", eventName: string, parameters: Record<string, unknown>) => void;
  };
  analyticsWindow.dataLayer?.push({ event: `configurator_${name}`, ...payload });
  analyticsWindow.gtag?.("event", `configurator_${name}`, payload);
}
