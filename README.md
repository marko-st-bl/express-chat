# SNI CHAT

1. ## Overview
   SNI chat is secure web application implemented using express.js and socket.io for real-time messaging. Application requires both server and client x509 certificates issuid by same CA. It uses **MFA** (Multi Factor Authentication) - step 1: username/password
   step 2: client certificate
   step 3: token sent to email that expires after three minutes. 
   Application also detecets and blocks any malicious users that attempt attacks (XSS, Injection, etc...)
2. ## Installation
   1. Create **.env** file in root folder
   ```
   PORT=4000
   MONGO_DB_HOST=mongodb://mongo:27017/sni-chat
   SECRET=secret
   MAIL_USER=test@gmail.com
   MAIL_PASS=password
   ```
   Here, you just need to change MAIL_USER and MAIL_PASS variables with your own.
   
   2. Open terminal in root folder of app and run following command.
   ```bash
   docker-compose up -d
   ```
1. ## Preview
   ![Preview](preview/sni.png)