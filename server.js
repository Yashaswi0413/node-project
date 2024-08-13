const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const otpGenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const cors = require('cors')
const PORT = process.env.PORT || 3000
const connectToDatabase = require('./db')

const app = express()

app.use(bodyParser.json())
app.use(cors())

require('dotenv').config()

connectToDatabase()

//Defining Schema and Model for OTP 
const otpSchema = new mongoose.Schema({
    email : String,
    otp : String,
    createdAt : {type : Date , expires : '5m' , default : Date.now}
})

const OTP = mongoose.model('OTP',otpSchema)

//Generate OTP & send email 
app.post('/generate-otp', async (req,res) => {
    const {email} = req.body
    const otp = otpGenerator.generate(6, {digits : true , alphabets : false , upperCase : false , specialChars : false})
    
    try {
        await OTP.create({email,otp})
        //Send OTP via email 
        const transporter = nodemailer.createTransport({
            service : 'gmail',
            auth : { 
                user : process.env.EMAIL_USER,
                pass : process.env.EMAIL_PASS
            }
        })
        await transporter.sendMail({
            from : process.env.EMAIL_USER,
            to : email,
            subject : 'OTP verificaiton',
            text : `Your OTP is ${otp}`
        })
        res.status(200).send("OTP send successfully")
    } catch (error) {
        console.log("Error in sending OTP : " , error);
        res.status(500).send("Error in sending OTP")
    }
})

//Verify OTP 
app.post('/verify-otp' , async (req,res) => {
    const {email,otp} = req.body
    try {
        const otpRecord = await OTP.findOne({email,otp}).exec()
        if (otpRecord) return res.status(200).send('OTP verified successfully');
        else res.status(400).send('Incorrect OTP')
    } catch (error) {
        console.log(error)
        res.status(500).send("Error in verifying OTP")
    }
})

app.listen(PORT,()=> console.log("Listening on PORT : " , PORT))