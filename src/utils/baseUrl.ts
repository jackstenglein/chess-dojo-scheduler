import {
  API_LOCAL,
  API_DEV,
  API_STAGING,
  GOOGLE_API_KEY,
  WEB_SOCKET_URL,
} from '@env';

export const BaseUrl = API_DEV;
export const WebSocketUrl = WEB_SOCKET_URL;
export const GoogleApiKey = GOOGLE_API_KEY;
export const BaseUrlWithoutApi = BaseUrl.replace('/api', '');
