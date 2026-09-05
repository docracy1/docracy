import { useEffect, useRef } from "react";
import { startCheckout, type Account } from "./api";
import { track } from "./track";

/** After login (`?checkout=1`), send a free account straight to Stripe once. */
export function useAutoCheckout(account: Account | null | undefined, source: string): boolean {
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !account || account.isPaid) return;
    if (new URLSearchParams(window.location.search).get("checkout") !== "1") return;
    started.current = true;
    track("upgrade_clicked", { source });
    startCheckout()
      .then(({ url }) => {
        window.location.href = url;
      })
      .catch(() => {
        started.current = false;
      });
  }, [account, source]);

  return started.current;
}
