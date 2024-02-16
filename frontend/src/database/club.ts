export interface Club {
    /** The id of the club. */
    id: string;

    /** The user-facing name of the club. */
    name: string;

    /** The short description of the club, which appears on the list page. */
    shortDescription: string;

    /** The description of the club. */
    description: string;

    /** The username of the owner of the club. */
    owner: string;

    /** The Stripe promo code associated with the club. */
    promoCode?: string;

    /** A link to the club's external webpage, if it has one. */
    externalUrl: string;

    /** The physical location of the club, if it has one. */
    location: ClubLocation;

    /** The number of members in the club. */
    memberCount: number;

    /** Whether the club is unlisted. */
    unlisted: boolean;

    /** Whether the club requires approval to join. */
    approvalRequired: boolean;

    /** Whether the club allows free-tier users to join. */
    allowFreeTier: boolean;

    /** The date and time the club was created. */
    createdAt: string;

    /** The date and time the club info (not members) was last updated. */
    updatedAt: string;
}

export interface ClubDetails extends Club {
    /** The members of the club, mapped by their usernames. */
    members: {
        [username: string]: ClubMember;
    };

    /** The pending requests to join the club, mapped by their usernames. */
    joinRequests: {
        [username: string]: ClubJoinRequest;
    };
}

export interface ClubLocation {
    /** The city the club is located in. */
    city: string;

    /** The state the club is located in. */
    state: string;

    /** The country the club is located in. */
    country: string;
}

export interface ClubMember {
    /** The username of the club member. */
    username: string;

    /** The date and time the user joined the club. */
    joinedAt: string;
}

export interface ClubJoinRequest {
    /** The username of the person requesting to join. */
    username: string;

    /** The display name of the person requesting to join. */
    displayName: string;

    /** The cohort of the person requesting to join. */
    cohort: string;

    /** Optional notes left by the person requesting to join. */
    notes: string;

    /** The date and time the join request was created. */
    createdAt: string;

    /** The status of the join request. */
    status: ClubJoinRequestStatus;
}

export enum ClubJoinRequestStatus {
    Pending = 'PENDING',
    Approved = 'APPROVED',
    Rejected = 'REJECTED',
}
