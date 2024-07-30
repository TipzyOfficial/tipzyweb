import { SongRequestType } from "./song";

export class Users {
    access_token: string;
    expires_at: number;
    name: string;
    image?: string;
    email: string;

    constructor(token: string, expires_at: number, name: string, image?: string, email?: string) {
        this.access_token = token;
        this.expires_at = expires_at;
        this.name = name;
        this.image = image;
        this.email = email ?? "";
    }

    setName(name: string) {
        this.name = name;
    }

    setEmail(email: string) {
        this.email = email;
    }
}

export class Consumer extends Users {
    birthday?: string;
    requests: SongRequestType[];
    id: number;

    constructor(token: string, expires_at: number, name: string, id: number, image?: string, email?: string, requests?: SongRequestType[]) {
        super(token, expires_at, name, image, email);
        this.id = id;
        this.requests = requests ?? [];
    }

    setBirthday(birthday?: string) {
        this.birthday = birthday;
    }
}