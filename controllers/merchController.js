function MerchController(database) {

    this.database = database

    const CONST = require("../utils/constants")
    const BigPromise = require("../middlewares/bigPromise")


    this.getMerchant = BigPromise(async (req, res, next) => {
        const jwtToken = req.cookies.jwt;
        const {email} = decodeJWT(jwtToken);
        const {merchandise} = await this.database.getUserByEmail(email);
        if(merchandise){
            res.status(CONST.httpStatus.OK);
            res.json({
                success:true,
                merchandise : merchandise
            });
        }
        else{
            res.status(CONST.httpStatus.OK);
            res.json({
                success:false,
                merchandise: null
            })
        }
    });
    this.bookMerchant = BigPromise(async (req, res, next) => {
        const {size, color} = req.body;
        if(!size || !color){
            res.status(CONST.httpStatus.BAD_REQUEST);
            res.json({
                success:false,
                message:"missing fields",
            });
        }
        const jwtToken = req.cookies.jwt;
        const {email} = decodeJWT(jwtToken);
        const {merchandise} = await this.database.getUserByEmail(email);
        if(merchandise){
            res.status(CONST.httpStatus.OK);
            res.json({
                success:true,
                message:"merchandise already added",
                merchandise : merchandise
            });
        }
        else{
            await this.database.addMerchToUser(email , size,color);
            res.status(CONST.httpStatus.CREATED);
            res.json({
                success:true,
                message: "merchandise added"
            })
        }
    });

}

const database = require("../services/database");
const { decodeJWT } = require("../utils/jwt");
const merchController = new MerchController(database)

module.exports = merchController
