import { AzureFunction, Context } from '@azure/functions'
import Dockerode = require('dockerode')
import nodemailer = require('nodemailer')
import Mail = require('nodemailer/lib/mailer')

const user = process.env.EMAIL
const pass = process.env.PASSWORDSMTP
const targetEmail = process.env.TARGETEMAIL
const dockerHost = process.env.DOCKERHOST
const dockerPort = process.env.DOCKERPORT

function mail (): Mail {
  return nodemailer.createTransport({
    service: 'gmail',
    secure: false,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

function createInstance (): Dockerode {
  return new Dockerode({
    socketPath: '',
    host: dockerHost,
    port: dockerPort
  })
}

async function sendEmail (email: string, message: string, errorMessage: string, context: Context): Promise<void> {
  try {
    await mail().sendMail({
      to: email,
      from: `"Docker Checker" <${user}>`,
      subject: 'Docker Alive Message',
      text: message,
      html: `<div>${message}<div>`
    })
  } catch (error) {
    if (error) {
      context.log(error)
      throw new Error(errorMessage)
    }
  }
}

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  // var timeStamp = new Date().toISOString();
  const dockerode = createInstance()

  try {
    const testping = await dockerode.ping()
    context.log(`O Docker do servidor Azure está ${testping.toString()}`)
    await sendEmail(
      targetEmail,
      `O Docker do servidor Azure está ${testping.toString()}`,
      'Erro ao tentar enviar email',
      context
    )
  } catch (error) {
    context.log(`Erro no servidor Docker ${error.message}`)
    await sendEmail(
      targetEmail, `Erro no servidor Docker ${error.message}`,
      'Erro ao tentar enviar email',
      context
    )
  }
  // if (myTimer.IsPastDue) {
  //     context.log('Timer function is running late!');
  // }
  // context.log('Timer trigger function ran!', timeStamp);
}

export default timerTrigger
