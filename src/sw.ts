import { defaultCache } from "@serwist/next/worker";
import { Serwist, type SerwistOptions } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: SerwistOptions["precacheEntries"];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
