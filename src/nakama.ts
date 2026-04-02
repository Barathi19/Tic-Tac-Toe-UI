import { Client, Session, type Socket } from '@heroiclabs/nakama-js';
const PORT = import.meta.env.PORT;
const NAKAMA_HOST = import.meta.env.NAKAMA_HOST;

export { Session };

const useSSL = true;
export const nakamaClient = new Client("defaultkey", NAKAMA_HOST, PORT, useSSL);

class NakamaState {
    private static instance: NakamaState;
    public session: Session | null = null;
    public socket: Socket | null = null;

    private constructor() { }

    public static getInstance(): NakamaState {
        if (!NakamaState.instance) {
            NakamaState.instance = new NakamaState();
        }
        return NakamaState.instance;
    }

    public async connectSocket(): Promise<Socket> {
        if (!this.session) throw new Error("No session active.");
        if (this.socket) return this.socket;

        const socket = nakamaClient.createSocket(useSSL, true);
        await socket.connect(this.session, true);
        this.socket = socket;
        return socket;
    }

    public logout() {
        this.session = null;
        if (this.socket) {
            this.socket.disconnect(false);
            this.socket = null;
        }
        localStorage.removeItem('nakama_auth_token');
        localStorage.removeItem('nakama_refresh_token');
    }
}

export const nakamaState = NakamaState.getInstance();
