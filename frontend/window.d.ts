import { Api } from 'chessground/api';

export {}; // This makes the file a module, preventing global scope pollution if not intended.

declare global {
    interface Window {
        chessground: Api;
    }
}
