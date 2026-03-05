require('dotenv').config();
const bcrypt = require('bcrypt');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const User = require('./User');
const connectDB = require('./db');

const app = express();
app.use(express.json());

connectDB();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

app.get('/', (req, res) => {
    res.send("Hello, World!");
});

app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const candidate = await User.findOne({ email });
        
        if (candidate) return res.status(400).send("Уже есть такой юзер");

        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt);

        const token = uuidv4();
        
        const user = new User({ email, password: hashedPassword, token }); 
        await user.save();

        const link = `http://localhost:${process.env.PORT || 3000}/activate/${token}`;
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Активация аккаунта',
            html: `<h3>Спасибо за регистрацию!</h3><a href="${link}">Нажми сюда для активации</a>`
        });

        res.send("Регистрация успешна! Проверьте почту.");
    } catch (e) {
        res.status(500).send("Ошибка сервера");
    }
});

app.get('/activate/:token', async (req, res) => {
    try {
        const user = await User.findOne({ token: req.params.token });
        if (user) {
            user.isActivated = true;
            user.token = null; 
            await user.save();
            res.send("<h1>Аккаунт успешно активирован!</h1>");
        } else {
            res.status(400).send("Токен неверный или уже использован");
        }
    } catch (e) {
        res.status(500).send("Ошибка активации");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).send("Пользователь не найден");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send("Неверный пароль");

        if (!user.isActivated) {
            return res.status(403).send("Аккаунт не активирован. Проверьте почту!");
        }

        res.send("Вы успешно вошли в систему!");
    } catch (e) {
        res.status(500).send("Ошибка при входе");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер: http://localhost:${PORT}`);
});