const jwt = require("jsonwebtoken");

const generateJWT = (userId, userEmail, provider = null, isNewUser=false) => {
    return jwt.sign(
        {
            id: userId,
            email: userEmail,
            providerId: provider,
            isNewUser: isNewUser
        },
        process.env.TOKEN_SECRET,
    );
};

const decodeJWT = (token) => {
    return jwt.decode(token, process.env.TOKEN_SECRET); 
    
};

module.exports = {
    generateJWT,
    decodeJWT  
}