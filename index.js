require("dotenv").config();
const express = require("express");
const { PrismaClient } =  require('@prisma/client');
const path = require("path")
const { generateAndSaveQRCode, verifyToken } = require("./utils/topt");

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname,"qr")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/register-totp", async (req, res) => {
   const {email} = req.body;
   if(!email) return res.status(400).send("Email is required");
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   
   const qrResult = await generateAndSaveQRCode(user.name);
   if(!qrResult) return res.status(500).send("please try gaian later");

   await prisma.user.update({
    where:{
        id:user.id,
        email:email
    },
    data:{
        secret:qrResult.secret
    }});

    return res.status(200).sendFile(path.join(__dirname,qrResult.filePath));
});

app.post("/verify",async (req,res)=>{
    const {email,otp} = req.body;
   if(!email || !otp ) return res.status(400).send("Email and otp required");
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   const verificationResult = await verifyToken(user.secret,otp);
   
   if(!verificationResult)  return res.status(401).send("unautharized");
   
   res.status(200).send("USer login sucecss");
})



app.listen(port, () => console.log(`Server started on port ${port}`))

