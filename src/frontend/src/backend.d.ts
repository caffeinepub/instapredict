import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type UserRole = { Admin: null } | { User: null } | { Guest: null };

export interface Prediction {
    id: string;
    hashtags: string[];
    contentType: string;
    timeOfUpload: string;
    followerCount: bigint;
    predictedLikes: bigint;
    timestamp: bigint;
    paid: boolean;
}

export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    savePrediction(
        id: string,
        hashtags: string[],
        contentType: string,
        timeOfUpload: string,
        followerCount: bigint,
        predictedLikes: bigint
    ): Promise<void>;
    markPredictionPaid(predId: string): Promise<boolean>;
    getPredictionHistory(): Promise<Prediction[]>;
    createRazorpayOrder(predId: string): Promise<string>;
    verifyRazorpayPayment(paymentId: string, predId: string): Promise<boolean>;
    getRazorpayKeyId(): Promise<string>;
}
