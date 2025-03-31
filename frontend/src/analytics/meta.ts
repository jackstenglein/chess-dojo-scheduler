function fbq(event: string, params?: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (window as any).fbq?.('track', event, params);
}

/** Emits a Meta Lead event. */
export function metaLead() {
    fbq('Lead');
}

/** Emits a Meta CompleteRegistration event. */
export function metaCompleteRegistration() {
    fbq('CompleteRegistration');
}

/** Emits a Meta InitiateCheckout event. */
export function metaInitiateCheckout(contentIds: string[], currency: string, value: number) {
    fbq('InitiateCheckout', {
        content_ids: contentIds,
        currency,
        value,
    });
}
