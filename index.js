require("dotenv").config();
const express = require("express");
const { PrismaClient } =  require('@prisma/client');
const path = require("path");
const session = require("express-session");
const { generateAndSaveQRCode, verifyToken } = require("./utils/topt");

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 5000;

app.use("/qr", express.static(path.join(__dirname, "qr")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(
   session({
     secret: "your-secret-key", // A secret key used for signing the session ID cookie
     resave: false, // Prevents resaving session if it wasn't modified
     saveUninitialized: true, // Saves new sessions even if they're empty
     cookie: { maxAge: 60000 }, // Session expiry time (in milliseconds)
   })
 );

app.post("/register-totp", async (req, res) => {
   const {email} = req.body;
   if(!email) return res.status(400).send("Email is required");
   if(req.session) req.session.email = null;
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   
   const qrResult = await generateAndSaveQRCode(user.name);
   if(!qrResult) return res.status(500).send("please try again later");

   await prisma.user.update({
    where:{
        id:user.id,
        email:email
    },
    data:{
        secret:qrResult.secret
    }});
    req.session.email = email;
   //  https://medipapel-sandbox-bucket.s3.ap-southeast-2.amazonaws.com/qrcodes/1737704763331qrcode.png
    const fullUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/qrcodes/${qrResult.fileName}`;

    return res.status(200).redirect(`/register-totp?filePath=${fullUrl}`);
});

app.post("/verify",async (req,res)=>{
    const email = req.session.email;
    const {otp} = req.body;
   if(!otp ) return res.status(400).send("Otp is required");
   const user = await prisma.user.findUnique({
      where: {
         email: email
      }
   });

   if(!user) return res.status(404).send("Email is not registered");
   const verificationResult = await verifyToken(user.secret,otp);
   
   if(!verificationResult)  return res.status(401).send("unautharized");
   
   res.status(200).render("dashboard",{username:user.name});
});

app.post("/logout", async(req, res) => {
   await prisma.user.update({
      where: {
         email: req.session.email
      },
      data: {
         secret: null
      }
   });
   req.session.email = null;
   res.redirect("/");
});

app.get("/", async(req, res) => {
   const users = await prisma.user.findMany();
   res.render('index', { users  });
});

app.get("/register-totp", (req, res) => {
   const { filePath } = req.query;
   res.render('register-totp', { filePath});
});

app.listen(port, () => console.log(`Server started on port ${port}`))

