# Social Authentication Setup

[**⬅ Back: All Tables**](./ALL_TABLES.md) | [**Next: Payment Setup ➔**](./PAYMENT_SETUP.md)

This guide outlines how to configure social authentication for Kawayan AI.

## 1. Prerequisites
You need developer accounts for the platforms you want to connect.

- **Facebook/Instagram:** [Meta for Developers](https://developers.facebook.com/)
- **TikTok:** [TikTok for Developers](https://developers.tiktok.com/)

## 2. Configuration
Add your App IDs / Client Keys to the `.env` file:

```env
VITE_FACEBOOK_APP_ID=your_fb_app_id
VITE_INSTAGRAM_APP_ID=your_ig_app_id
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
```

## 3. OAuth Redirect URIs
In your developer consoles, you must whitelist the following Redirect URIs:

- `https://your-domain.com/auth/callback/facebook`
- `https://your-domain.com/auth/callback/instagram`
- `https://your-domain.com/auth/callback/tiktok`

## 4. Implementation Note
The system currently redirects the user to the official login pages. To handle the response, you will need to implement a callback route in the frontend that:
1.  Captures the `code` from the URL.
2.  Sends it to your backend.
3.  Exchanges it for a long-lived Access Token.
4.  Updates the connection status in the database.
