const jwt = require("jsonwebtoken");

const generateJWT = (userId, userEmail, provider = null) => {
    return jwt.sign(
        {
            id: userId,
            email: userEmail,
            providerId: provider
        },
        process.env.TOKEN_SECRET,
        { expiresIn: "1h" }  // Set expiration (adjust as needed)
    );
};

const decodeJWT = (token) => {
    try {
        return jwt.verify(token, process.env.TOKEN_SECRET); 
    } catch (error) {
        return null;  
    }
};

module.exports = {
    generateJWT,
    decodeJWT  
}