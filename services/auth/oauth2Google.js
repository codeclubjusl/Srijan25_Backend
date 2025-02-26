const GoogleStrategy = require("passport-google-oauth20").Strategy;
const database = require("../../services/database");
const logger = require("../../services/log/logger");

async function handleGoogleAuth(profile) {
    // console.log('🔍 Processing Google profile:', JSON.stringify(profile, null, 2));
    
    try {
        // Check for existing user by Google ID
        const existingUser = await database.getUserByProviderId(profile.id);
        if (existingUser) {
            console.log('✅ Found existing Google user');
            return {user: existingUser, isNewUser: false};
        }

        // Check for user by email
        const email = profile.emails[0].value;
        const emailUser = await database.getUserByEmail(email);
        //console.log(emailUser);
        if (emailUser) {
            console.log('📧 Linking Google account to existing email user');
            //console.log(emailUser);
            await database.addProviderUser({
                userId: emailUser._id.toString(),
                providerUserId: profile.id,
                providerName: 'google',
                picture: profile.photos[0]?.value
            });
            const updatedUser = await database.getUserByEmail(email);
    
            //console.log('🔄 Updated user after linking:', updatedUser);
            return {user:updatedUser.toJSON(), isNewUser:false};
        }

        // Create new user
        // console.log('🆕 Creating new user from Google profile');
        const newUser = await database.createUser({
            name: profile.displayName,
            email: email,
            emailVerified: true,
            providers: [{
                providerName: 'google',
                providerUserId: profile.id,
                picture: profile.photos[0]?.value
            }],
            photo: {
                url: profile.photos[0]?.value,
                isGooglePhoto: true
            }
        });

        return {user:newUser, isNewUser: true};
    } catch (error) {
        // console.error('❗ Error in Google auth handler:', error);
        throw error;
    }
}

const googleProvider = new GoogleStrategy({
    clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    callbackURL: `${process.env.BACK_HOST}/api/v1/oauth/google/callback`,
     passReqToCallback: true
}, 
async (req, accessToken, refreshToken, profile, done) => {
    try {
        // console.log('🔑 Received Google profile ID:', profile.id);
        const {user, isNewUser} = await handleGoogleAuth(profile);
        done(null, { user, isNewUser });
    } catch (error) {
        // console.error('❌ Google strategy error:', error);
        done(error, null);
    }
});

googleProvider.name = "google";
module.exports = googleProvider;
