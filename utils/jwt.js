const jwt = require("jsonwebtoken");

const generateJWT = (userId, userEmail, provider = null) => {
    return jwt.sign(
        {
            id: userId,
            email: userEmail,
            providerId: provider
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