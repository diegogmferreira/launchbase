const User = require('../models/User')
const { hash } = require('bcryptjs')

const crypto = require('crypto')
const mailer = require('../../lib/mailer')

module.exports = {
    loginForm(req, res) {
        return res.render("session/login")
    },
    login(req,res){
        req.session.userId = req.user.id

        return res.redirect("/users")
    },
    logout(req, res) {
        req.session.destroy()
        return res.redirect("/")
    },
    forgotForm(req, res) {
        return res.render("session/forgot-password")
    },
    async forgot(req, res) {
        const user = req.user

        try{
            // um token para esse usuário
            const token = crypto.randomBytes(20).toString("hex")

            // criar expiração
            let now = new Date ()
            now = now.setHours(now.getHours() + 1)

            await User.update(user.id, {
                reset_token: token,
                reset_token_expires: now
            })

            // enviar um email com o link de recuperação de senha
            await mailer.sendMail({
                to: user.email,
                from: 'no-replay@launchstore.com.br',
                subject: 'Recuperação de Senha',
                html: ` <h2>Esqueceu a senha?</h2>
                <p>Não se preocupe, clique no link abaixo apra recuperar a sua senha</p>
                <p>
                    <a href="http://localhost:3000/users/password-reset?token=${token}" target="_blank">
                        RECUPERAR SENHA
                    </a>
                </p>
                `,
            })

            // avisar o usuário que enviamos o email
            return res.render("session/forgot-password", {
                success: "Você receberá um email com um link para recuperação de senha!"
            })

        } catch(err) {
            console.error(err)
            return res.render("session/forgot-password", {
                error: "Erro interno! Tente novamente mais tarde"
            })
        }
        
    },
    resetForm (req, res){
        return res.render("session/password-reset", { token: req.query.token })
    },
    async reset (req, res) {
        const user = req.user
        const { password, token } = req.body

        try {
            // criar novo hash de senha
            const newPassword = await hash(password, 8)

            // atualizar o usuário / senha
            await User.update(user.id, {
                password: newPassword,
                reset_token: "",
                reset_token_expires: ""
            })

            // avisar o usuário que nova senha foi atualizada com sucesso
            return res.render('session/login', {
                user: req.body,
                success: "Senha atualizada com sucesso"
            })

        }catch (err){
            console.error(err)
            return res.render("session/password-reset", {
                user: req.body,
                token,
                error: "Erro interno! Tente novamente mais tarde"
            })
        }
    }
}