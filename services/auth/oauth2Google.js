const GoogleStrategy = require("passport-google-oauth20").Strategy;
const database = require("../../services/database");
const logger = require("../../services/log/logger");

async function handleGoogleAuth(profile) {
    console.log('🔍 Processing Google profile:', JSON.stringify(profile, null, 2));
    
    try {
        // Check for existing user by Google ID
        const existingUser = await database.getUserByProviderId(profile.id);
        if (existingUser) {
            console.log('✅ Found existing Google user');
            return existingUser;
        }

        // Check for user by email
        const email = profile.emails[0].value;
        const emailUser = await database.getUserByEmail(email);
        if (emailUser) {
            console.log('📧 Linking Google account to existing email user');
            await database.addProviderUser({
                userId: emailUser.id,
                providerUserId: profile.id,
                providerName: 'google',
                picture: profile.photos[0]?.value
            });
            return emailUser;
        }

        // Create new user
        console.log('🆕 Creating new user from Google profile');
        const newUser = await database.createUser({
            name: profile.displayName,
            email: email,
            providers: [{
                providerName: 'google',
                providerUserId: profile.id,
                picture: profile.photos[0]?.value
            }]
        });

        return newUser;
    } catch (error) {
        console.error('❗ Error in Google auth handler:', error);
        throw error;
    }
}

const googleProvider = new GoogleStrategy({
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    callbackURL: `http://${process.env.BACK_HOST}:${process.env.BACK_PORT}/api/v1/oauth/google/callback`,
     passReqToCallback: true
}, 
async (req, accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔑 Received Google profile ID:', profile.id);
        const user = await handleGoogleAuth(profile);
        done(null, user);
    } catch (error) {
        console.error('❌ Google strategy error:', error);
        done(error, null);
    }
});

googleProvider.name = "google";
module.exports = googleProvider;