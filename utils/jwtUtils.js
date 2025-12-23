const jwt = require("jsonwebtoken");

const JWT_SECRET = "secret";
const JWT_EXPIRES_IN = "1h";
function signToken(payload) {
    return jwt.sign(payload,JWT_SECRET,{
        expiresIn: JWT_EXPIRES_IN
    });
}
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
function getUserIDFromToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return {
            userId: decoded.id,
            username:decoded.username,
        }
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}

module.exports = {
    signToken,
    getUserIDFromToken,
    verifyToken
};
  