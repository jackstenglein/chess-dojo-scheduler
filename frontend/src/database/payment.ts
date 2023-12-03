export enum StripeCapabilityStatus {
    Active = 'active',
    Inactive = 'inactive',
    Pending = 'pending',
}

export enum StripePayoutInterval {
    Manual = 'manual',
    Daily = 'daily',
    Weekly = 'weekly',
    Monthly = 'monthly',
}

export enum StripePayoutMethod {
    BankAccount = 'bank_account',
    Card = 'card',
}

export interface StripeAccount {
    capabilities: {
        tax_reporting_us_1099_k: StripeCapabilityStatus;
        transfers: StripeCapabilityStatus;
    };
    charges_enabled: boolean;
    country: string;
    default_currency: string;
    deleted: boolean;
    details_submitted: boolean;
    email: string;
    external_accounts: {
        has_more: boolean;
        total_count: number;
        url: string;
        data: {
            id: string;
            object: StripePayoutMethod;
        }[];
    };
    payouts_enabled: boolean;
    settings: {
        payouts: {
            debit_negative_balances: boolean;
            schedule: {
                delay_days: number;
                interval: StripePayoutInterval;
                monthly_anchor: number;
                weekly_anchor: string;
            };
        };
    };
}
