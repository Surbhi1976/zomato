const { OAuth2Client } = require('google-auth-library');

let client;
const getClient = () => (client ??= new OAuth2Client());

// Verifies a Google ID token (the "credential" the browser gets after the Google popup).
// Checks Google's signature, expiry, issuer, and that the token was issued for OUR app (audience = our Client ID).
// Throws if anything is wrong; returns the token payload otherwise.
async function verifyGoogleCredential(credential) {
    const ticket = await getClient().verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}

module.exports = { verifyGoogleCredential, getClient };
