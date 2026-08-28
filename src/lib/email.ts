import nodemailer from 'nodemailer'

interface SendWelcomeEmailProps {
  email: string
  fullName: string
  organizationName: string
  role: string
  tempPassword?: string // Só será enviado se for um utilizador novo
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendWelcomeEmail({ email, fullName, organizationName, role, tempPassword }: SendWelcomeEmailProps) {
  try {
    const roleMap: Record<string, string> = {
      OWNER: 'Administrador Principal (Owner)',
      ADMIN: 'Gestor (Admin)',
      OPERATOR: 'Operador'
    }

    const displayRole = roleMap[role] || role
    
    let htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333; max-w-xl; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1B4D3E;">Bem-vindo ao AgroTech!</h2>
        <p>Olá <strong>${fullName || 'Utilizador'}</strong>,</p>
        <p>A sua conta foi adicionada à empresa <strong>${organizationName}</strong> com o cargo de <strong>${displayRole}</strong>.</p>
    `

    if (tempPassword) {
      // Novo utilizador
      htmlContent += `
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="margin: 0;">Foi gerada uma password temporária para o seu primeiro acesso:</p>
          <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #1B4D3E;">${tempPassword}</p>
        </div>
        <p>Recomendamos que altere esta password assim que efetuar o seu primeiro login no sistema.</p>
      `
    } else {
      // Utilizador já existia
      htmlContent += `
        <p>Como já possuía uma conta no sistema AgroTech, <strong>a sua password atual mantém-se inalterada</strong>.</p>
        <p>Pode aceder imediatamente e escolher a empresa ${organizationName} no seu painel.</p>
      `
    }

    htmlContent += `
        <br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" 
           style="display: inline-block; padding: 10px 20px; background-color: #1B4D3E; color: white; text-decoration: none; border-radius: 5px;">
           Aceder à Plataforma
        </a>
        <br/><br/>
        <p style="font-size: 12px; color: #666;">Equipa AgroTech &copy; ${new Date().getFullYear()}</p>
      </div>
    `

    const mailOptions = {
      from: `"AgroTech" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: tempPassword ? 'Bem-vindo ao AgroTech - Os seus dados de acesso' : 'Nova vinculação de Empresa no AgroTech',
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email enviado com sucesso: %s', info.messageId)
    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
}
