import { SongRequestType } from "./song";

export class Users {
    access_token: string;
    expires_at: number;
    name: string;
    image?: string;
    email: string;


    constructor(token: string, expires_at: number, name: string, image?: string, email ?: string) {
        this.access_token = token;
        this.expires_at = expires_at;
        this.name = name;
        this.image = image;
        this.email = email ?? "";
    }

    setName(name: string){
        this.name = name;
    }

    setEmail(email: string){
        this.email = email;
    }
}

export class Consumer extends Users {
    birthday?: string;
    token_count: number;
    pending_tokens: number;
    pending_requests: SongRequestType[];
    stripe_id?: string;

    constructor(token: string, expires_at: number, name: string, image?: string, email ?: string, token_count ?: number, pending_requests?: SongRequestType[], pending_tokens?: number) {
        super(token, expires_at, name, image, email);
        this.token_count = token_count ?? 0;
        this.pending_requests = pending_requests ?? [];
        if(!pending_tokens) {
            let t = 0;
            this.pending_requests.forEach((e) => {
                t += e.tokenCount;
            })
            this.pending_tokens = t;
        } else {
            this.pending_tokens = pending_tokens;
        }
    }

    setBirthday(birthday?: string) {
        this.birthday = birthday;
    }
    setTokenCount(token_count?: number) {
        this.token_count = token_count ?? -1;
    }
    setStripeID(stripe_id?: string) {
        this.stripe_id = stripe_id;
    }
}

export class Business extends Users {
    business_name?: string;
    business_image?: string;
    type?: string;
    address?: string;
    vibe?: string;

    setBusinessName(name?: string){
        this.business_name = name;
    }
    setBusinessImage(imageurl?: string){
        this.business_image = imageurl;
    }
    setType(type?: string){
        this.type = type;
    }
    setAddress(address?: string){
        this.address = address;
    }
    setVibe(vibe?: string){
        this.vibe = vibe;
    }
}