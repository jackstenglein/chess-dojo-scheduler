function fbq(event: string, params?: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (window as any).fbq?.('track', event, params);
}

/** Emits a Meta Lead event. */
export function metaLead() {
    fbq('Lead');
}
